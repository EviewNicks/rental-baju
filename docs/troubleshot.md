Error: ./node_modules/@prisma/client/runtime/library.mjs
Code generation for chunk item errored
An error occurred while generating the chunk item [project]/node_modules/@prisma/client/runtime/library.mjs [app-client] (ecmascript)

Caused by:
- the chunking context (unknown) does not support external modules (request: node:module)

Debug info:
- An error occurred while generating the chunk item [project]/node_modules/@prisma/client/runtime/library.mjs [app-client] (ecmascript)
- Execution of <ModuleChunkItem as EcmascriptChunkItem>::content_with_async_module_info failed
- Execution of EcmascriptModuleContent::new failed
- the chunking context (unknown) does not support external modules (request: node:module)
    at BuildError (http://localhost:3000/_next/static/chunks/%5Broot-of-the-server%5D__e2c08166._.js:17395:41)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:13596:24)
    at renderWithHooksAgain (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:3615:24)
    at renderWithHooks (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:3566:28)
    at updateFunctionComponent (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:5317:21)
    at beginWork (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:5916:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:1335:74)
    at performUnitOfWork (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:7988:97)
    at workLoopSync (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:7880:40)
    at renderRootSync (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:7863:13)
    at performWorkOnRoot (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:7602:212)
    at performWorkOnRootViaSchedulerTask (http://localhost:3000/_next/static/chunks/node_modules_react-dom_82bb97c6._.js:8566:9)
    at MessagePort.performWorkUntilDeadline (http://localhost:3000/_next/static/chunks/node_modules_a51498a5._.js:1119:64)