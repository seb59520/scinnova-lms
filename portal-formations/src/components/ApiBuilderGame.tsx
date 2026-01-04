import { useState, useRef } from 'react'
import { CheckCircle, XCircle, RotateCcw, Trash2, Plus, AlertCircle } from 'lucide-react'
import type { BaseGameProps } from '../lib/gameRegistry'

interface Block {
  id: string
  type: 'resource' | 'verb' | 'endpoint' | 'status'
  label: string
  value: string
  color: string
  x?: number
  y?: number
}

interface Route {
  id: string
  resource: Block | null
  verb: Block | null
  endpoint: Block | null
  status: Block | null
}

interface ApiBuilderGameProps extends BaseGameProps {
  resources?: Array<{ id: string; label: string; value: string }>
  verbs?: Array<{ id: string; label: string; value: string }>
  endpoints?: Array<{ id: string; label: string; value: string }>
  statusCodes?: Array<{ id: string; label: string; value: string }>
  correctRoutes?: Array<{
    resource: string
    verb: string
    endpoint: string
    status: string
  }>
}

const DEFAULT_RESOURCES = [
  { id: 'user', label: 'User', value: 'users' },
  { id: 'order', label: 'Order', value: 'orders' },
  { id: 'product', label: 'Product', value: 'products' }
]

const DEFAULT_VERBS = [
  { id: 'get', label: 'GET', value: 'GET' },
  { id: 'post', label: 'POST', value: 'POST' },
  { id: 'put', label: 'PUT', value: 'PUT' },
  { id: 'delete', label: 'DELETE', value: 'DELETE' }
]

const DEFAULT_ENDPOINTS = [
  { id: 'collection', label: '/users', value: '/users' },
  { id: 'item', label: '/users/{id}', value: '/users/{id}' },
  { id: 'orders-collection', label: '/orders', value: '/orders' },
  { id: 'orders-item', label: '/orders/{id}', value: '/orders/{id}' },
  { id: 'products-collection', label: '/products', value: '/products' },
  { id: 'products-item', label: '/products/{id}', value: '/products/{id}' }
]

const DEFAULT_STATUS_CODES = [
  { id: '200', label: '200 OK', value: '200' },
  { id: '201', label: '201 Created', value: '201' },
  { id: '204', label: '204 No Content', value: '204' },
  { id: '400', label: '400 Bad Request', value: '400' },
  { id: '404', label: '404 Not Found', value: '404' }
]

const RESOURCE_COLOR = '#3B82F6' // Bleu
const VERB_COLOR = '#10B981' // Vert
const ENDPOINT_COLOR = '#8B5CF6' // Violet
const STATUS_COLOR = '#F59E0B' // Orange

export function ApiBuilderGame({
  resources = DEFAULT_RESOURCES,
  verbs = DEFAULT_VERBS,
  endpoints = DEFAULT_ENDPOINTS,
  statusCodes = DEFAULT_STATUS_CODES,
  correctRoutes = [],
  onScore,
  description,
  instructions
}: ApiBuilderGameProps) {
  const [routes, setRoutes] = useState<Route[]>([{ id: 'route-1', resource: null, verb: null, endpoint: null, status: null }])
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)
  const [draggedOverSlot, setDraggedOverSlot] = useState<{ routeId: string; slot: keyof Route } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Convertir les props en blocs
  const availableBlocks: Block[] = [
    ...resources.map(r => ({ ...r, type: 'resource' as const, color: RESOURCE_COLOR })),
    ...verbs.map(v => ({ ...v, type: 'verb' as const, color: VERB_COLOR })),
    ...endpoints.map(e => ({ ...e, type: 'endpoint' as const, color: ENDPOINT_COLOR })),
    ...statusCodes.map(s => ({ ...s, type: 'status' as const, color: STATUS_COLOR }))
  ]

  const handleDragStart = (e: React.DragEvent, block: Block) => {
    setDraggedBlock(block)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', block.id)
  }

  const handleDragOver = (e: React.DragEvent, routeId: string, slot: keyof Route) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverSlot({ routeId, slot })
  }

  const handleDragLeave = () => {
    setDraggedOverSlot(null)
  }

  const handleDrop = (e: React.DragEvent, routeId: string, slot: keyof Route) => {
    e.preventDefault()
    if (!draggedBlock) return

    // Vérifier que le type de bloc correspond au slot
    const slotTypeMap: Record<keyof Route, Block['type']> = {
      id: 'resource', // pas utilisé
      resource: 'resource',
      verb: 'verb',
      endpoint: 'endpoint',
      status: 'status'
    }

    if (draggedBlock.type !== slotTypeMap[slot]) {
      setDraggedBlock(null)
      setDraggedOverSlot(null)
      return
    }

    setRoutes(prev => prev.map(route => {
      if (route.id === routeId) {
        return { ...route, [slot]: draggedBlock }
      }
      return route
    }))

    setDraggedBlock(null)
    setDraggedOverSlot(null)
  }

  const addRoute = () => {
    setRoutes(prev => [...prev, {
      id: `route-${Date.now()}`,
      resource: null,
      verb: null,
      endpoint: null,
      status: null
    }])
  }

  const removeRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(r => r.id !== routeId))
  }

  const validateRoute = (route: Route): 'valid' | 'acceptable' | 'invalid' => {
    if (!route.resource || !route.verb || !route.endpoint || !route.status) {
      return 'invalid'
    }

    const resource = route.resource.value
    const verb = route.verb.value
    const endpoint = route.endpoint.value
    const status = route.status.value

    // Règles REST strictes
    const isCollection = !endpoint.includes('{id}')
    const isItem = endpoint.includes('{id}')

    // GET sur collection → 200
    if (verb === 'GET' && isCollection && status === '200') return 'valid'
    // GET sur item → 200
    if (verb === 'GET' && isItem && status === '200') return 'valid'
    // POST sur collection → 201
    if (verb === 'POST' && isCollection && status === '201') return 'valid'
    // PUT sur item → 200 ou 204
    if (verb === 'PUT' && isItem && (status === '200' || status === '204')) return 'valid'
    // DELETE sur item → 204 ou 200
    if (verb === 'DELETE' && isItem && (status === '204' || status === '200')) return 'valid'

    // Règles acceptables (moins strictes)
    // POST avec 200 au lieu de 201 → acceptable
    if (verb === 'POST' && isCollection && status === '200') return 'acceptable'
    // PUT avec 201 → acceptable (peu commun mais possible)
    if (verb === 'PUT' && isItem && status === '201') return 'acceptable'

    // Anti-patterns
    // GET avec 201, 204, 400, 404 (sauf 404 pour item non trouvé)
    if (verb === 'GET' && ['201', '204', '400'].includes(status)) return 'invalid'
    // POST sur item → invalid
    if (verb === 'POST' && isItem) return 'invalid'
    // DELETE sur collection → invalid
    if (verb === 'DELETE' && isCollection) return 'invalid'
    // PUT sur collection → invalid
    if (verb === 'PUT' && isCollection) return 'invalid'

    // Endpoint ne correspond pas à la ressource
    if (isCollection && !endpoint.includes(`/${resource}`)) return 'invalid'
    if (isItem && !endpoint.includes(`/${resource}/`)) return 'invalid'

    return 'invalid'
  }

  const checkResults = () => {
    setShowResults(true)
    
    if (correctRoutes.length > 0) {
      // Validation par rapport aux routes correctes
      let correctCount = 0
      routes.forEach(route => {
        if (!route.resource || !route.verb || !route.endpoint || !route.status) return
        
        const isCorrect = correctRoutes.some(cr => 
          cr.resource === route.resource!.value &&
          cr.verb === route.verb!.value &&
          cr.endpoint === route.endpoint!.value &&
          cr.status === route.status!.value
        )
        
        if (isCorrect) correctCount++
      })
      
      const score = Math.round((correctCount / correctRoutes.length) * 100)
      onScore?.(score, {
        total: correctRoutes.length,
        correct: correctCount,
        routes: routes.length
      })
    } else {
      // Validation par règles REST
      let validCount = 0
      let acceptableCount = 0
      let invalidCount = 0
      
      routes.forEach(route => {
        const validation = validateRoute(route)
        if (validation === 'valid') validCount++
        else if (validation === 'acceptable') acceptableCount++
        else invalidCount++
      })
      
      const total = routes.length
      const score = Math.round(((validCount * 100 + acceptableCount * 50) / (total * 100)) * 100)
      onScore?.(score, {
        total,
        valid: validCount,
        acceptable: acceptableCount,
        invalid: invalidCount
      })
    }
  }

  const reset = () => {
    setRoutes([{ id: 'route-1', resource: null, verb: null, endpoint: null, status: null }])
    setShowResults(false)
  }

  const getValidationColor = (route: Route): string => {
    if (!showResults) return 'transparent'
    const validation = validateRoute(route)
    if (validation === 'valid') return '#10B981' // Vert
    if (validation === 'acceptable') return '#F59E0B' // Orange
    return '#EF4444' // Rouge
  }

  const getValidationIcon = (route: Route) => {
    if (!showResults) return null
    const validation = validateRoute(route)
    if (validation === 'valid') return <CheckCircle className="w-5 h-5 text-green-500" />
    if (validation === 'acceptable') return <AlertCircle className="w-5 h-5 text-orange-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  return (
    <div className="api-builder-game space-y-6 p-6 bg-gray-50 rounded-lg">
      {description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{description}</p>
        </div>
      )}

      {instructions && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">📋 Instructions</h3>
          <p className="text-purple-800 text-sm">{instructions}</p>
        </div>
      )}

      {/* Palette de blocs */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">🧱 Blocs disponibles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Ressources */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Ressources</h4>
            <div className="space-y-2">
              {availableBlocks.filter(b => b.type === 'resource').map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  className="px-3 py-2 rounded cursor-move hover:opacity-80 transition-opacity text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: block.color }}
                >
                  {block.label}
                </div>
              ))}
            </div>
          </div>

          {/* Verbes HTTP */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Verbes HTTP</h4>
            <div className="space-y-2">
              {availableBlocks.filter(b => b.type === 'verb').map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  className="px-3 py-2 rounded cursor-move hover:opacity-80 transition-opacity text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: block.color }}
                >
                  {block.label}
                </div>
              ))}
            </div>
          </div>

          {/* Endpoints */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Endpoints</h4>
            <div className="space-y-2">
              {availableBlocks.filter(b => b.type === 'endpoint').map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  className="px-3 py-2 rounded cursor-move hover:opacity-80 transition-opacity text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: block.color }}
                >
                  {block.label}
                </div>
              ))}
            </div>
          </div>

          {/* Status Codes */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Status Codes</h4>
            <div className="space-y-2">
              {availableBlocks.filter(b => b.type === 'status').map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  className="px-3 py-2 rounded cursor-move hover:opacity-80 transition-opacity text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: block.color }}
                >
                  {block.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas - Routes */}
      <div ref={canvasRef} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">🎯 Routes construites</h3>
            {correctRoutes.length > 0 && (
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {routes.filter(r => r.resource && r.verb && r.endpoint && r.status).length} / {correctRoutes.length} routes créées
              </span>
            )}
          </div>
          <button
            onClick={addRoute}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter une route
          </button>
        </div>

        <div className="space-y-4">
          {routes.map((route, index) => (
            <div
              key={route.id}
              className="border-2 rounded-lg p-4 transition-all"
              style={{
                borderColor: getValidationColor(route),
                backgroundColor: showResults ? `${getValidationColor(route)}10` : 'transparent'
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Route #{index + 1}</span>
                  {getValidationIcon(route)}
                </div>
                {routes.length > 1 && (
                  <button
                    onClick={() => removeRoute(route.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Slot Ressource */}
                <div
                  onDragOver={(e) => handleDragOver(e, route.id, 'resource')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, route.id, 'resource')}
                  className={`min-h-[60px] border-2 border-dashed rounded p-2 flex items-center justify-center transition-colors ${
                    draggedOverSlot?.routeId === route.id && draggedOverSlot?.slot === 'resource'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                >
                  {route.resource ? (
                    <div
                      className="px-3 py-2 rounded text-sm font-medium text-white shadow-sm"
                      style={{ backgroundColor: route.resource.color }}
                    >
                      {route.resource.label}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">🧱 Ressource</span>
                  )}
                </div>

                {/* Slot Verbe */}
                <div
                  onDragOver={(e) => handleDragOver(e, route.id, 'verb')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, route.id, 'verb')}
                  className={`min-h-[60px] border-2 border-dashed rounded p-2 flex items-center justify-center transition-colors ${
                    draggedOverSlot?.routeId === route.id && draggedOverSlot?.slot === 'verb'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`}
                >
                  {route.verb ? (
                    <div
                      className="px-3 py-2 rounded text-sm font-medium text-white shadow-sm"
                      style={{ backgroundColor: route.verb.color }}
                    >
                      {route.verb.label}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">🔧 Verbe HTTP</span>
                  )}
                </div>

                {/* Slot Endpoint */}
                <div
                  onDragOver={(e) => handleDragOver(e, route.id, 'endpoint')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, route.id, 'endpoint')}
                  className={`min-h-[60px] border-2 border-dashed rounded p-2 flex items-center justify-center transition-colors ${
                    draggedOverSlot?.routeId === route.id && draggedOverSlot?.slot === 'endpoint'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300'
                  }`}
                >
                  {route.endpoint ? (
                    <div
                      className="px-3 py-2 rounded text-sm font-medium text-white shadow-sm"
                      style={{ backgroundColor: route.endpoint.color }}
                    >
                      {route.endpoint.label}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">🎯 Endpoint</span>
                  )}
                </div>

                {/* Slot Status */}
                <div
                  onDragOver={(e) => handleDragOver(e, route.id, 'status')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, route.id, 'status')}
                  className={`min-h-[60px] border-2 border-dashed rounded p-2 flex items-center justify-center transition-colors ${
                    draggedOverSlot?.routeId === route.id && draggedOverSlot?.slot === 'status'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300'
                  }`}
                >
                  {route.status ? (
                    <div
                      className="px-3 py-2 rounded text-sm font-medium text-white shadow-sm"
                      style={{ backgroundColor: route.status.color }}
                    >
                      {route.status.label}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">🏷️ Status Code</span>
                  )}
                </div>
              </div>

              {showResults && (
                <div className="mt-3 text-xs">
                  {validateRoute(route) === 'valid' && (
                    <p className="text-green-600">✅ Route REST valide</p>
                  )}
                  {validateRoute(route) === 'acceptable' && (
                    <p className="text-orange-600">⚠️ Route REST acceptable (peut être améliorée)</p>
                  )}
                  {validateRoute(route) === 'invalid' && (
                    <p className="text-red-600">❌ Anti-pattern REST détecté</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-between items-center">
        <div className="text-sm text-gray-600">
          {correctRoutes.length > 0 ? (
            <span>
              Objectif : Créer <strong>{correctRoutes.length}</strong> route{correctRoutes.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              {routes.filter(r => r.resource && r.verb && r.endpoint && r.status).length} route{routes.filter(r => r.resource && r.verb && r.endpoint && r.status).length > 1 ? 's' : ''} complète{routes.filter(r => r.resource && r.verb && r.endpoint && r.status).length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={checkResults}
            disabled={routes.filter(r => r.resource && r.verb && r.endpoint && r.status).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            Valider les routes
          </button>
        </div>
      </div>
    </div>
  )
}

