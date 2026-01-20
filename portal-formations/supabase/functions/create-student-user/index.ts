import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FUNCTION_VERSION = '2026-01-19-01'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-auth-token, x-admin-token, x-supabase-auth-token, X-Admin-Auth-Token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Log IMMÉDIATEMENT pour voir si la fonction est appelée
  console.log(`[create-student-user] ${FUNCTION_VERSION} - Function called`, {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[create-student-user] OPTIONS request - returning CORS headers')
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  // Log pour les requêtes POST
  console.log(`[create-student-user] POST request received`, {
    hasAuth: !!req.headers.get('Authorization'),
    hasCustomToken: !!req.headers.get('X-Admin-Auth-Token'),
    allHeaders: Object.fromEntries(req.headers.entries()),
  })

  try {
    console.log(`[create-student-user] Processing ${req.method} request`)

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

    // Créer un client Supabase Admin (utilisé pour toutes les opérations)
    const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Récupérer le token d'authentification depuis les headers
    // Supabase passe automatiquement le token dans Authorization quand on utilise functions.invoke()
    const bearerHeader = req.headers.get('Authorization')
    let token = ''
    
    if (bearerHeader?.startsWith('Bearer ')) {
      token = bearerHeader.replace('Bearer ', '').trim()
      console.log('[create-student-user] Token found in Authorization header, length:', token.length)
    } else {
      // Fallback sur les headers personnalisés si Authorization n'est pas présent
      token = req.headers.get('X-Admin-Auth-Token')
        ?? req.headers.get('x-admin-auth-token')
        ?? req.headers.get('x-admin-token')
        ?? req.headers.get('x-supabase-auth-token')
        ?? ''
      token = token.trim()
      if (token) {
        console.log('[create-student-user] Token found in custom header, length:', token.length)
      }
    }

    if (!token) {
      const allHeaders = Object.fromEntries(req.headers.entries())
      console.error('[create-student-user] Missing authentication token')
      console.error('[create-student-user] All headers:', JSON.stringify(allHeaders, null, 2))
      return new Response(
        JSON.stringify({ 
          error: 'Authentification requise. Token manquant dans les headers.',
          debug: {
            hasAuthorization: !!req.headers.get('Authorization'),
            hasXAdminAuthToken: !!req.headers.get('X-Admin-Auth-Token'),
            headersCount: Object.keys(allHeaders).length
          }
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('[create-student-user] Token found, length:', token.length, 'first 20 chars:', token.substring(0, 20))

    // Décoder rapidement le JWT pour récupérer l'ID utilisateur
    let userId: string | null = null
    try {
      console.log('[create-student-user] Attempting to decode JWT')
      const [, payload] = token.split('.')
      if (payload) {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=')
        const decoded = JSON.parse(atob(padded))
        userId = decoded.sub || decoded.user_id || decoded.id || null
        console.log('[create-student-user] JWT decoded successfully, userId:', userId)
      }
    } catch (decodeError) {
      console.warn('[create-student-user] JWT decode error, fallback to auth API:', decodeError)
    }

    if (!userId) {
      console.log('[create-student-user] JWT decode failed, trying auth API')
      // Si le décodage échoue, vérifier le token via l'API Auth officielle
      const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(token)

      if (userError || !userResult?.user) {
        console.error('[create-student-user] Auth API error:', userError)
        return new Response(
          JSON.stringify({ error: `Authentification invalide: ${userError?.message || 'Token invalide'}` }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      userId = userResult.user.id
      console.log('[create-student-user] User ID from auth API:', userId)
    }

    console.log('[create-student-user] Checking if user is admin, userId:', userId)
    // Vérifier que l'utilisateur est admin en utilisant l'API Admin (bypass RLS)
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileCheckError) {
      console.error('[create-student-user] Profile check error:', profileCheckError)
      return new Response(
        JSON.stringify({ error: `Erreur lors de la vérification du profil: ${profileCheckError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[create-student-user] Profile found:', { role: profile?.role, isAdmin: profile?.role === 'admin' })

    if (!profile || profile.role !== 'admin') {
      console.warn('[create-student-user] Access denied - user is not admin')
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Seuls les administrateurs peuvent créer des utilisateurs.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[create-student-user] Admin verified, proceeding with user creation')

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
