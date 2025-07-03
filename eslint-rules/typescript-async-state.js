/**
 * TypeScript-specific ESLint Rules untuk mendeteksi Async State Issues
 * Menggunakan TypeScript AST untuk analisis yang lebih mendalam
 */

module.exports = {
  rules: {
    // Rule 1: Detect useState callback dependency issues
    'useState-stale-closure': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect potential stale closure issues in useState callbacks',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          staleClosure: 'State "{{stateName}}" may be stale in callback. Consider using functional update or useRef.',
        },
      },
      create(context) {
        const stateVariables = new Set()
        
        return {
          // Track useState declarations
          CallExpression(node) {
            if (node.callee.name === 'useState') {
              const parent = node.parent
              if (parent.id && parent.id.elements && parent.id.elements[0]) {
                stateVariables.add(parent.id.elements[0].name)
              }
            }
          },
          
          // Check useCallback/useEffect dependencies
          Property(node) {
            if (node.key.name === 'deps' || 
                (node.parent.parent.callee && 
                 (node.parent.parent.callee.name === 'useCallback' || 
                  node.parent.parent.callee.name === 'useEffect'))) {
              
              // Get the callback function
              const callback = node.parent.parent.arguments[0]
              if (callback && callback.body) {
                const callbackText = context.getSourceCode().getText(callback)
                
                // Check if state variables are used in callback but not in deps
                for (const stateVar of stateVariables) {
                  if (callbackText.includes(stateVar)) {
                    const dependencies = node.value.elements || []
                    const hasDependency = dependencies.some(dep => 
                      dep.name === stateVar
                    )
                    
                    if (!hasDependency) {
                      context.report({
                        node: callback,
                        messageId: 'staleClosure',
                        data: { stateName: stateVar },
                      })
                    }
                  }
                }
              }
            }
          },
        }
      },
    },

    // Rule 2: Detect async function without proper error handling
    'async-state-error-handling': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Async functions in React should handle AbortError separately',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          missingAbortHandling: 'Async function should handle AbortError separately from other errors.',
        },
      },
      create(context) {
        return {
          TryStatement(node) {
            const hasAwait = context.getSourceCode().getText(node.block).includes('await')
            const hasFetch = context.getSourceCode().getText(node.block).includes('fetch')
            
            if (hasAwait && hasFetch && node.handler) {
              const catchBlock = context.getSourceCode().getText(node.handler.body)
              const hasAbortCheck = catchBlock.includes('AbortError') || 
                                   catchBlock.includes('error.name === \'AbortError\'')
              
              if (!hasAbortCheck) {
                context.report({
                  node: node.handler,
                  messageId: 'missingAbortHandling',
                })
              }
            }
          },
        }
      },
    },

    // Rule 3: Detect useEffect cleanup issues
    'useEffect-cleanup-required': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'useEffect with async operations should return cleanup function',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          needsCleanup: 'useEffect with async operations should return cleanup function to prevent memory leaks.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name === 'useEffect') {
              const effectCallback = node.arguments[0]
              if (effectCallback && effectCallback.body) {
                const effectText = context.getSourceCode().getText(effectCallback.body)
                const hasAsync = effectText.includes('fetch') || 
                                effectText.includes('setTimeout') || 
                                effectText.includes('setInterval')
                
                if (hasAsync) {
                  // Check if there's a return statement with cleanup
                  const hasReturn = effectText.includes('return')
                  const hasCleanup = effectText.includes('clearTimeout') || 
                                    effectText.includes('clearInterval') || 
                                    effectText.includes('abort')
                  
                  if (!hasReturn || !hasCleanup) {
                    context.report({
                      node: effectCallback,
                      messageId: 'needsCleanup',
                    })
                  }
                }
              }
            }
          },
        }
      },
    },

    // Rule 4: Detect state update in unmounted component
    'prevent-state-update-unmounted': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent state updates in unmounted components',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          unmountedUpdate: 'State update may occur after component unmount. Add mounted check or use AbortController.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            // Look for setState calls inside async functions
            if (node.callee.name && node.callee.name.startsWith('set')) {
              let parent = node.parent
              while (parent) {
                if (parent.type === 'ArrowFunctionExpression' || 
                    parent.type === 'FunctionExpression') {
                  const funcText = context.getSourceCode().getText(parent)
                  if (funcText.includes('await') || funcText.includes('.then(')) {
                    // Check if there's a mounted check
                    const hasMountedCheck = funcText.includes('mounted') || 
                                           funcText.includes('aborted') || 
                                           funcText.includes('AbortController')
                    
                    if (!hasMountedCheck) {
                      context.report({
                        node,
                        messageId: 'unmountedUpdate',
                      })
                    }
                    break
                  }
                }
                parent = parent.parent
              }
            }
          },
        }
      },
    },

    // Rule 5: Detect race condition in sequential state updates
    'sequential-state-race': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Sequential state updates may cause race conditions',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          sequentialRace: 'Sequential state updates detected. Consider using useReducer or functional updates.',
        },
      },
      create(context) {
        return {
          BlockStatement(node) {
            const setterCalls = []
            
            // Collect all setState calls in the block
            for (const statement of node.body) {
              if (statement.type === 'ExpressionStatement' && 
                  statement.expression.type === 'CallExpression' &&
                  statement.expression.callee.name &&
                  statement.expression.callee.name.startsWith('set')) {
                setterCalls.push(statement.expression.callee.name)
              }
            }
            
            // Check for multiple setState calls for the same state
            const stateNames = setterCalls.map(call => call.slice(3).toLowerCase())
            const duplicates = stateNames.filter((name, index) => 
              stateNames.indexOf(name) !== index
            )
            
            if (duplicates.length > 0) {
              context.report({
                node,
                messageId: 'sequentialRace',
              })
            }
          },
        }
      },
    },
  },
}