/**
 * Custom ESLint Rules untuk mendeteksi React Async State Issues
 * Menangkap pola-pola yang menyebabkan race conditions dan state batching problems
 */

module.exports = {
  rules: {
    // Rule 1: Detect immediate state access after setState
    'no-immediate-state-access': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent accessing state immediately after setState',
          category: 'Possible Errors',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          immediateAccess: 'Avoid accessing "{{stateName}}" immediately after "{{setterName}}". Use useRef or callback pattern instead.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            // Detect pattern: setX(value); if (x === something)
            if (node.callee.name && node.callee.name.startsWith('set')) {
              const stateName = node.callee.name.slice(3).toLowerCase()
              const parent = node.parent
              
              // Check next sibling for immediate state access
              if (parent && parent.body) {
                const currentIndex = parent.body.indexOf(node.parent)
                const nextStatement = parent.body[currentIndex + 1]
                
                if (nextStatement && 
                    nextStatement.test && 
                    nextStatement.test.left && 
                    nextStatement.test.left.name === stateName) {
                  context.report({
                    node: nextStatement,
                    messageId: 'immediateAccess',
                    data: {
                      stateName,
                      setterName: node.callee.name,
                    },
                  })
                }
              }
            }
          },
        }
      },
    },

    // Rule 2: Detect missing abort controllers in fetch calls
    'require-abort-controller': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require AbortController for fetch calls in React components',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          missingAbortController: 'Fetch call should use AbortController to prevent race conditions. Add signal parameter.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name === 'fetch') {
              const options = node.arguments[1]
              
              if (!options || 
                  !options.properties || 
                  !options.properties.some(prop => prop.key.name === 'signal')) {
                context.report({
                  node,
                  messageId: 'missingAbortController',
                })
              }
            }
          },
        }
      },
    },

    // Rule 3: Detect useState with Set/Map without useRef
    'state-collection-needs-ref': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'useState with Set/Map should have corresponding useRef for immediate access',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          needsRef: 'State "{{stateName}}" using {{collectionType}} should have corresponding useRef for immediate access.',
        },
      },
      create(context) {
        const stateCollections = new Map()
        const refs = new Set()
        
        return {
          CallExpression(node) {
            // Track useState with Set/Map
            if (node.callee.name === 'useState') {
              const init = node.arguments[0]
              if (init && init.callee && 
                  (init.callee.name === 'Set' || init.callee.name === 'Map')) {
                const parent = node.parent
                if (parent.id && parent.id.elements) {
                  const stateName = parent.id.elements[0].name
                  stateCollections.set(stateName, init.callee.name)
                }
              }
            }
            
            // Track useRef calls
            if (node.callee.name === 'useRef') {
              const parent = node.parent
              if (parent.id && parent.id.name) {
                refs.add(parent.id.name)
              }
            }
          },
          
          'Program:exit'() {
            // Check if Set/Map states have corresponding refs
            for (const [stateName, collectionType] of stateCollections) {
              const expectedRefName = `${stateName}Ref`
              if (!refs.has(expectedRefName)) {
                context.report({
                  node: context.getSourceCode().ast,
                  messageId: 'needsRef',
                  data: {
                    stateName,
                    collectionType,
                  },
                })
              }
            }
          },
        }
      },
    },

    // Rule 4: Detect missing debouncing for search inputs
    'require-search-debounce': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Search inputs should be debounced to prevent excessive API calls',
          category: 'Performance',
          recommended: true,
        },
        schema: [],
        messages: {
          needsDebounce: 'Search input "{{inputName}}" should be debounced. Consider using setTimeout or debounce library.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name === 'onChange' && 
                node.parent.name && 
                (node.parent.name.name.toLowerCase().includes('search') || 
                 node.parent.name.name.toLowerCase().includes('query'))) {
              
              // Check if the onChange handler includes debouncing
              const handler = node.value.expression
              if (handler && handler.body) {
                const hasSetTimeout = context.getSourceCode().getText(handler).includes('setTimeout')
                const hasDebounce = context.getSourceCode().getText(handler).includes('debounce')
                
                if (!hasSetTimeout && !hasDebounce) {
                  context.report({
                    node,
                    messageId: 'needsDebounce',
                    data: {
                      inputName: node.parent.name.name,
                    },
                  })
                }
              }
            }
          },
        }
      },
    },

    // Rule 5: Detect complex state that should use useReducer
    'complex-state-needs-reducer': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Complex state objects should use useReducer instead of useState',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          useReducer: 'Complex state object "{{stateName}}" with {{propertyCount}} properties should use useReducer for atomic updates.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name === 'useState') {
              const init = node.arguments[0]
              if (init && init.type === 'ObjectExpression' && init.properties.length >= 3) {
                const parent = node.parent
                if (parent.id && parent.id.elements) {
                  const stateName = parent.id.elements[0].name
                  context.report({
                    node,
                    messageId: 'useReducer',
                    data: {
                      stateName,
                      propertyCount: init.properties.length,
                    },
                  })
                }
              }
            }
          },
        }
      },
    },
  },
}