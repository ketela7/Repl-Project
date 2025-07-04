/**
 * Simplified TypeScript-specific ESLint rules
 * Focus on practical async state patterns
 */

module.exports = {
  rules: {
    // Rule: Detect missing AbortController in async functions
    'async-needs-abort-controller': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Async functions with fetch should use AbortController',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          missingAbortController: 'Async function with fetch should use AbortController to prevent race conditions',
        },
      },
      create(context) {
        return {
          FunctionDeclaration(node) {
            if (node.async) {
              const functionText = context.getSourceCode().getText(node.body);
              const hasFetch = functionText.includes('fetch');
              const hasAbortController = functionText.includes('AbortController') || 
                                        functionText.includes('signal');

              if (hasFetch && !hasAbortController) {
                context.report({
                  node,
                  messageId: 'missingAbortController',
                });
              }
            }
          },
          ArrowFunctionExpression(node) {
            if (node.async) {
              const functionText = context.getSourceCode().getText(node.body);
              const hasFetch = functionText.includes('fetch');
              const hasAbortController = functionText.includes('AbortController') || 
                                        functionText.includes('signal');

              if (hasFetch && !hasAbortController) {
                context.report({
                  node,
                  messageId: 'missingAbortController',
                });
              }
            }
          },
        };
      },
    },
  },
};