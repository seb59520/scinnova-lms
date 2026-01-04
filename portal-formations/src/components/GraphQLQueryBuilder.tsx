import { useState, useRef } from 'react'
import { CheckCircle, XCircle, RotateCcw, Trash2, Plus, AlertCircle, Play, Eye } from 'lucide-react'
import type { BaseGameProps } from '../lib/gameRegistry'

interface GraphQLField {
  id: string
  name: string
  type: string
  isRequired: boolean
  isList: boolean
  description?: string
  args?: Array<{ name: string; type: string; defaultValue?: any }>
  fields?: GraphQLField[]
}

interface GraphQLType {
  name: string
  kind: 'OBJECT' | 'SCALAR' | 'LIST' | 'NON_NULL'
  fields?: GraphQLField[]
  description?: string
}

interface SelectedField {
  id: string
  fieldName: string
  parentId?: string
  args?: Record<string, any>
  children: SelectedField[]
}

interface Scenario {
  id: string
  title: string
  description: string
  objective: string
  query?: string
  expectedFields?: string[]
  maxCost?: number
}

interface GraphQLQueryBuilderProps extends BaseGameProps {
  schema?: {
    types: GraphQLType[]
    queryType: string
  }
  scenarios?: Scenario[]
  currentScenario?: number
}

const DEFAULT_SCHEMA = {
  queryType: 'Query',
  types: [
    {
      name: 'Query',
      kind: 'OBJECT',
      fields: [
        {
          id: 'user',
          name: 'user',
          type: 'User',
          isRequired: false,
          isList: false,
          args: [
            { name: 'id', type: 'ID!', defaultValue: null }
          ],
          fields: [
            { id: 'id', name: 'id', type: 'ID', isRequired: true, isList: false },
            { id: 'name', name: 'name', type: 'String', isRequired: true, isList: false },
            { id: 'email', name: 'email', type: 'String', isRequired: true, isList: false },
            { id: 'orders', name: 'orders', type: 'Order', isRequired: false, isList: true }
          ]
        },
        {
          id: 'users',
          name: 'users',
          type: 'User',
          isRequired: false,
          isList: true,
          args: [
            { name: 'limit', type: 'Int', defaultValue: 10 }
          ],
          fields: [
            { id: 'id', name: 'id', type: 'ID', isRequired: true, isList: false },
            { id: 'name', name: 'name', type: 'String', isRequired: true, isList: false },
            { id: 'email', name: 'email', type: 'String', isRequired: true, isList: false }
          ]
        }
      ]
    },
    {
      name: 'User',
      kind: 'OBJECT',
      fields: [
        { id: 'id', name: 'id', type: 'ID', isRequired: true, isList: false },
        { id: 'name', name: 'name', type: 'String', isRequired: true, isList: false },
        { id: 'email', name: 'email', type: 'String', isRequired: true, isList: false },
        {
          id: 'orders',
          name: 'orders',
          type: 'Order',
          isRequired: false,
          isList: true,
          args: [
            { name: 'limit', type: 'Int', defaultValue: null }
          ]
        }
      ]
    },
    {
      name: 'Order',
      kind: 'OBJECT',
      fields: [
        { id: 'id', name: 'id', type: 'ID', isRequired: true, isList: false },
        { id: 'total', name: 'total', type: 'Float', isRequired: true, isList: false },
        { id: 'date', name: 'date', type: 'String', isRequired: true, isList: false },
        {
          id: 'items',
          name: 'items',
          type: 'OrderItem',
          isRequired: false,
          isList: true
        }
      ]
    },
    {
      name: 'OrderItem',
      kind: 'OBJECT',
      fields: [
        { id: 'id', name: 'id', type: 'ID', isRequired: true, isList: false },
        { id: 'quantity', name: 'quantity', type: 'Int', isRequired: true, isList: false },
        {
          id: 'product',
          name: 'product',
          type: 'Product',
          isRequired: false,
          isList: false
        }
      ]
    },
    {
      name: 'Product',
      kind: 'OBJECT',
      fields: [
        { id: 'id', name: 'id', type: 'ID', isRequired: true, isList: false },
        { id: 'name', name: 'name', type: 'String', isRequired: true, isList: false },
        { id: 'price', name: 'price', type: 'Float', isRequired: true, isList: false }
      ]
    }
  ]
}

export function GraphQLQueryBuilder({
  schema = DEFAULT_SCHEMA,
  scenarios = [],
  currentScenario = 0,
  onScore,
  description,
  instructions
}: GraphQLQueryBuilderProps) {
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([])
  const [draggedField, setDraggedField] = useState<GraphQLField | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [queryResult, setQueryResult] = useState<any>(null)
  const [activeScenario, setActiveScenario] = useState(currentScenario)
  const [fieldArgs, setFieldArgs] = useState<Record<string, Record<string, any>>>({})

  const currentScenarioData = scenarios[activeScenario] || null

  const getTypeFields = (typeName: string): GraphQLField[] => {
    const type = schema.types.find(t => t.name === typeName)
    return type?.fields || []
  }

  const getQueryFields = (): GraphQLField[] => {
    const queryType = schema.types.find(t => t.name === schema.queryType)
    return queryType?.fields || []
  }

  const handleDragStart = (e: React.DragEvent, field: GraphQLField) => {
    setDraggedField(field)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, parentId?: string) => {
    e.preventDefault()
    if (!draggedField) return

    // Vérifier si le champ peut être ajouté ici
    if (parentId) {
      const parent = findFieldById(selectedFields, parentId)
      if (!parent) {
        setDraggedField(null)
        return
      }
      
      // Vérifier que le type du parent correspond
      const parentType = getFieldType(parent.fieldName, parent.parentId)
      if (!parentType) {
        setDraggedField(null)
        return
      }
      
      const parentFields = getTypeFields(parentType)
      // Vérifier par nom plutôt que par id car les ids peuvent différer
      if (!parentFields.find(f => f.name === draggedField.name)) {
        setDraggedField(null)
        return
      }
    } else {
      // Vérifier que c'est un champ de Query
      const queryFields = getQueryFields()
      if (!queryFields.find(f => f.name === draggedField.name)) {
        setDraggedField(null)
        return
      }
    }

    const newField: SelectedField = {
      id: `${draggedField.id}-${Date.now()}`,
      fieldName: draggedField.name,
      parentId,
      args: {},
      children: []
    }

    if (parentId) {
      setSelectedFields(prev => addFieldToParent(prev, parentId, newField))
    } else {
      setSelectedFields(prev => [...prev, newField])
    }

    setDraggedField(null)
  }

  const findFieldById = (fields: SelectedField[], id: string): SelectedField | null => {
    for (const field of fields) {
      if (field.id === id) return field
      const found = findFieldById(field.children, id)
      if (found) return found
    }
    return null
  }

  const addFieldToParent = (fields: SelectedField[], parentId: string, newField: SelectedField): SelectedField[] => {
    return fields.map(field => {
      if (field.id === parentId) {
        return { ...field, children: [...field.children, newField] }
      }
      return { ...field, children: addFieldToParent(field.children, parentId, newField) }
    })
  }

  const removeField = (fieldId: string) => {
    setSelectedFields(prev => removeFieldFromTree(prev, fieldId))
  }

  const removeFieldFromTree = (fields: SelectedField[], id: string): SelectedField[] => {
    return fields
      .filter(f => f.id !== id)
      .map(f => ({ ...f, children: removeFieldFromTree(f.children, id) }))
  }

  const getFieldType = (fieldName: string, parentId?: string): string => {
    if (!parentId) {
      // C'est un champ racine de Query
      const queryField = getQueryFields().find(f => f.name === fieldName)
      return queryField?.type || ''
    }
    
    // Trouver le parent dans l'arbre
    const parent = findFieldById(selectedFields, parentId)
    if (!parent) return ''
    
    // Récursivement trouver le type du parent
    const parentType = getFieldType(parent.fieldName, parent.parentId)
    if (!parentType) return ''
    
    // Trouver les champs du type parent
    const parentFields = getTypeFields(parentType)
    const field = parentFields.find(f => f.name === fieldName)
    return field?.type || ''
  }

  const getAvailableFields = (parentId?: string): GraphQLField[] => {
    if (!parentId) {
      // Retourner les champs de Query
      return getQueryFields()
    }
    
    // Trouver le parent
    const parent = findFieldById(selectedFields, parentId)
    if (!parent) return []
    
    // Obtenir le type du parent
    const parentType = getFieldType(parent.fieldName, parent.parentId)
    if (!parentType) return []
    
    // Retourner les champs disponibles pour ce type
    return getTypeFields(parentType)
  }

  const buildQuery = (): string => {
    if (selectedFields.length === 0) return ''
    
    const buildField = (field: SelectedField, indent: number = 0): string => {
      const indentStr = '  '.repeat(indent)
      let query = `${indentStr}${field.fieldName}`
      
      // Ajouter les arguments
      const args = fieldArgs[field.id] || {}
      const argsStr = Object.entries(args)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
          const strValue = typeof value === 'string' ? `"${value}"` : String(value)
          return `${key}: ${strValue}`
        })
        .join(', ')
      
      if (argsStr) {
        query += `(${argsStr})`
      }
      
      if (field.children.length > 0) {
        query += ' {\n'
        query += field.children.map(child => buildField(child, indent + 1)).join('\n')
        query += `\n${indentStr}}`
      }
      
      return query
    }
    
    return `query {\n${selectedFields.map(f => buildField(f, 1)).join('\n')}\n}`
  }

  const validateQuery = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (selectedFields.length === 0) {
      errors.push('Aucun champ sélectionné')
      return { valid: false, errors }
    }
    
    // Vérifier que tous les champs requis ont des enfants
    const validateField = (field: SelectedField): void => {
      const fieldType = getFieldType(field.fieldName, field.parentId)
      const type = schema.types.find(t => t.name === fieldType)
      
      if (type && type.kind === 'OBJECT' && field.children.length === 0) {
        errors.push(`Le champ "${field.fieldName}" de type objet doit avoir au moins un sous-champ`)
      }
      
      field.children.forEach(validateField)
    }
    
    selectedFields.forEach(validateField)
    
    return { valid: errors.length === 0, errors }
  }

  const executeQuery = () => {
    const validation = validateQuery()
    if (!validation.valid) {
      alert(`Erreurs :\n${validation.errors.join('\n')}`)
      return
    }
    
    // Simuler un résultat
    const mockResult = generateMockResult(selectedFields)
    setQueryResult(mockResult)
    setShowPreview(true)
    
    // Calculer le score
    if (currentScenarioData) {
      const score = calculateScore(selectedFields, currentScenarioData)
      onScore?.(score, {
        query: buildQuery(),
        fieldsCount: countFields(selectedFields),
        scenario: currentScenarioData.id
      })
    }
  }

  const generateMockResult = (fields: SelectedField[]): any => {
    const result: any = {}
    
    fields.forEach(field => {
      const fieldType = getFieldType(field.fieldName, field.parentId)
      const type = schema.types.find(t => t.name === fieldType)
      
      if (type?.kind === 'OBJECT') {
        result[field.fieldName] = field.children.length > 0
          ? generateMockResult(field.children)
          : { id: '1', __typename: fieldType }
      } else {
        // Valeurs mock selon le type
        if (fieldType === 'ID') result[field.fieldName] = '1'
        else if (fieldType === 'String') result[field.fieldName] = 'Example'
        else if (fieldType === 'Int') result[field.fieldName] = 42
        else if (fieldType === 'Float') result[field.fieldName] = 99.99
        else result[field.fieldName] = null
      }
    })
    
    return result
  }

  const countFields = (fields: SelectedField[]): number => {
    return fields.reduce((count, field) => {
      return count + 1 + countFields(field.children)
    }, 0)
  }

  const calculateScore = (fields: SelectedField[], scenario: Scenario): number => {
    let score = 100
    
    // Vérifier si les champs attendus sont présents
    if (scenario.expectedFields) {
      const selectedFieldNames = getAllFieldNames(fields)
      const missingFields = scenario.expectedFields.filter(f => !selectedFieldNames.includes(f))
      score -= missingFields.length * 20
    }
    
    // Pénalité pour trop de champs (si maxCost défini)
    if (scenario.maxCost) {
      const totalFields = countFields(fields)
      if (totalFields > scenario.maxCost) {
        score -= (totalFields - scenario.maxCost) * 5
      }
    }
    
    return Math.max(0, Math.min(100, score))
  }

  const getAllFieldNames = (fields: SelectedField[]): string[] => {
    const names: string[] = []
    fields.forEach(field => {
      names.push(field.fieldName)
      names.push(...getAllFieldNames(field.children))
    })
    return names
  }

  const reset = () => {
    setSelectedFields([])
    setShowPreview(false)
    setQueryResult(null)
    setFieldArgs({})
  }

  const renderField = (field: SelectedField, depth: number = 0) => {
    const availableFields = getAvailableFields(field.id)
    const fieldType = getFieldType(field.fieldName, field.parentId)
    const type = schema.types.find(t => t.name === fieldType)
    const canHaveChildren = type?.kind === 'OBJECT' && availableFields.length > 0

    return (
      <div className="ml-4 border-l-2 border-gray-300 pl-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded">
            <span className="font-medium text-blue-900">{field.fieldName}</span>
            <button
              onClick={() => removeField(field.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {canHaveChildren && (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, field.id)}
            className="min-h-[40px] border-2 border-dashed border-gray-300 rounded p-2 mb-2 bg-gray-50"
          >
            {field.children.length === 0 ? (
              <span className="text-xs text-gray-400">Glissez des champs ici</span>
            ) : (
              field.children.map(child => renderField(child, depth + 1))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="graphql-query-builder space-y-6 p-6 bg-gray-50 rounded-lg">
      {description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{description}</p>
        </div>
      )}

      {instructions && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">📋 Instructions</h3>
          <p className="text-purple-800 text-sm whitespace-pre-line">{instructions}</p>
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">🎯 Scénarios</h3>
          <div className="flex gap-2 flex-wrap">
            {scenarios.map((scenario, index) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setActiveScenario(index)
                  reset()
                }}
                className={`px-4 py-2 rounded transition-colors ${
                  activeScenario === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {scenario.title}
              </button>
            ))}
          </div>
          {currentScenarioData && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-900 mb-1">{currentScenarioData.title}</h4>
              <p className="text-sm text-gray-700 mb-2">{currentScenarioData.description}</p>
              <p className="text-sm font-medium text-blue-700">🎯 Objectif : {currentScenarioData.objective}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schéma GraphQL (Gauche) */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">📊 Schéma GraphQL</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {getQueryFields().map(field => (
              <div key={field.id} className="border border-gray-200 rounded p-3">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, field)}
                  className="cursor-move bg-green-100 px-3 py-2 rounded mb-2 hover:bg-green-200 transition-colors"
                >
                  <div className="font-medium text-green-900">{field.name}</div>
                  <div className="text-xs text-green-700">→ {field.type}</div>
                </div>
                {field.fields && field.fields.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {field.fields.map(subField => (
                      <div
                        key={subField.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, subField)}
                        className="cursor-move bg-blue-100 px-2 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                      >
                        {subField.name}: {subField.type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zone de construction (Centre) */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">🔨 Requête GraphQL</h3>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
          
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e)}
            className="min-h-[400px] border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50 mb-4"
          >
            {selectedFields.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="mb-2">Glissez des champs depuis le schéma</p>
                <p className="text-sm">Commencez par un champ de Query (user, users, etc.)</p>
              </div>
            ) : (
              selectedFields.map(field => renderField(field))
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={executeQuery}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex-1"
            >
              <Play className="w-4 h-4" />
              Exécuter la requête
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview JSON (Droite) */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">👁️ Preview</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Requête GraphQL</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-[200px]">
                {buildQuery() || '// Aucune requête construite'}
              </pre>
            </div>
            {showPreview && queryResult && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Résultat JSON</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
            {showPreview && !queryResult && (
              <div className="text-sm text-gray-500">
                Cliquez sur "Exécuter la requête" pour voir le résultat
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

