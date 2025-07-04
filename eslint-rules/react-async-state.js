/**
 * Simplified custom ESLint rules for React async state patterns
 * Focus on practical, working rules that integrate with existing ESLint config
 */

module.exports = {
  rules: {
    // Rule: Detect fetch calls without error handling
    'fetch-needs-error-handling': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Fetch calls should include error handling',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          missingErrorHandling: 'Fetch call should include proper error handling (try/catch or .catch())',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name === 'fetch') {
              // Check if fetch is wrapped in try/catch or has .catch()
              let parent = node.parent;
              let hasTryCatch = false;
              let hasCatch = false;

              // Check for try/catch
              while (parent) {
                if (parent.type === 'TryStatement') {
                  hasTryCatch = true;
                  break;
                }
                parent = parent.parent;
              }

              // Check for .catch()
              if (node.parent.type === 'MemberExpression' && 
                  node.parent.property.name === 'then') {
                // Look for chained .catch()
                let current = node.parent.parent;
                while (current && current.type === 'CallExpression') {
                  if (current.callee.type === 'MemberExpression' && 
                      current.callee.property.name === 'catch') {
                    hasCatch = true;
                    break;
                  }
                  current = current.parent;
                }
              }

              if (!hasTryCatch && !hasCatch) {
                context.report({
                  node,
                  messageId: 'missingErrorHandling',
                });
              }
            }
          },
        };
      },
    },

    // Rule: Detect useEffect without cleanup
    'useEffect-needs-cleanup': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'useEffect with side effects should return cleanup function',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          needsCleanup: 'useEffect with timers or async operations should return cleanup function',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name === 'useEffect') {
              const effectCallback = node.arguments[0];
              if (effectCallback && effectCallback.body) {
                const effectText = context.getSourceCode().getText(effectCallback.body);
                const hasSideEffects = effectText.includes('setTimeout') || 
                                      effectText.includes('setInterval') || 
                                      effectText.includes('fetch');

                if (hasSideEffects) {
                  const hasReturn = effectText.includes('return');
                  if (!hasReturn) {
                    context.report({
                      node: effectCallback,
                      messageId: 'needsCleanup',
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
  },
};