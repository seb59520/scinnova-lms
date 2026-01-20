import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FUNCTION_VERSION = '2026-01-20-01'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-auth-token, x-admin-token, x-supabase-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

function decodeJwt(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=')
    return JSON.parse(atob(padded))
  } catch (error) {
    console.warn('JWT decode error:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    console.log(`[create-student-user] version ${FUNCTION_VERSION} - request received`, {
      method: req.method,
      hasCustomToken: !!(req.headers.get('X-Admin-Auth-Token') ?? req.headers.get('x-admin-auth-token') ?? req.headers.get('x-admin-token') ?? req.headers.get('x-supabase-auth-token')),
      authHeaderPresent: !!req.headers.get('Authorization')
    })

    // Récupérer les variables d'environnement
    // Dans Supabase Edge Functions, ces variables sont automatiquement disponibles
    const supabaseAdminUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') 
      ?? Deno.env.get('SB_SERVICE_ROLE_KEY')
      ?? ''

    if (!supabaseAdminUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseAdminUrl,
        hasKey: !!supabaseServiceKey,
      })
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Créer un client Supabase Admin (utilisé pour toutes les opérations)
    const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    const supabaseAuth = supabaseAnonKey
      ? createClient(supabaseAdminUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
      : null

    // Récupérer le token d'authentification depuis un header dédié
    const customTokenHeader = req.headers.get('X-Admin-Auth-Token')
      ?? req.headers.get('x-admin-auth-token')
      ?? req.headers.get('x-admin-token')
      ?? req.headers.get('x-supabase-auth-token')

    let token = customTokenHeader?.trim() || ''
    
    if (!token) {
      const bearerHeader = req.headers.get('Authorization')
      if (bearerHeader?.startsWith('Bearer ')) {
        token = bearerHeader.replace('Bearer ', '').trim()
      }
    }

    if (!token) {
      console.error('Missing admin token header')
      return new Response(
        JSON.stringify({ error: 'Authentification requise. Utilisateur admin introuvable.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Décoder rapidement le JWT pour récupérer l'ID utilisateur
    let userId: string | null = null
    const decodedToken = decodeJwt(token)
    if (decodedToken) {
      const nowInSeconds = Math.floor(Date.now() / 1000)
      if (decodedToken.exp && decodedToken.exp < nowInSeconds) {
        console.error('Token expired')
        return new Response(
          JSON.stringify({ error: 'Session expirée, veuillez vous reconnecter.' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      userId = decodedToken.sub || decodedToken.user_id || decodedToken.id || null
    }

    if (!userId && supabaseAuth) {
      // Si le décodage échoue, vérifier le token via l'API Auth officielle
      const { data: userResult, error: userError } = await supabaseAuth.auth.getUser(token)

      if (userError || !userResult.user) {
        console.error('Auth error:', userError)
        return new Response(
          JSON.stringify({ error: `Authentification invalide: ${userError?.message || 'Token invalide'}` }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      userId = userResult.user.id
    }

    if (!userId) {
      console.error('Unable to extract user id from token')
      return new Response(
        JSON.stringify({ error: 'Authentification invalide: utilisateur introuvable.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Vérifier que l'utilisateur est admin en utilisant l'API Admin (bypass RLS)
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileCheckError) {
      console.error('Profile check error:', profileCheckError)
      return new Response(
        JSON.stringify({ error: `Erreur lors de la vérification du profil: ${profileCheckError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Seuls les administrateurs peuvent créer des utilisateurs.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Le client supabaseAdmin est déjà créé ci-dessus

    // Récupérer les données de la requête
    const { studentId, password, fullName, role = 'student' } = await req.json()

    if (!studentId || !password) {
      return new Response(
        JSON.stringify({ error: 'studentId et password sont requis' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Vérifier que l'identifiant étudiant n'existe pas déjà
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Cet identifiant étudiant est déjà utilisé' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Générer un email unique pour Supabase Auth
    // Format: student_id@students.scinnova.fr
    const cleanStudentId = studentId.toLowerCase().replace(/[^a-z0-9]/g, '')
    const email = `${cleanStudentId}@students.scinnova.fr`

    // Créer l'utilisateur avec l'API Admin (contourne les validations d'email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        full_name: fullName || '',
        student_id: studentId,
      },
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'utilisateur' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mettre à jour le profil avec le rôle et l'identifiant étudiant
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: role,
        full_name: fullName || '',
        student_id: studentId,
      })
      .eq('id', authData.user.id)

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      // Essayer d'insérer le profil si la mise à jour échoue
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: role,
          full_name: fullName || '',
          student_id: studentId,
        })

      if (insertError) {
        return new Response(
          JSON.stringify({ error: `Erreur lors de la création du profil: ${insertError.message}` }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          student_id: studentId,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
