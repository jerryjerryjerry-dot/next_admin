import { postRouter } from "~/server/api/routers/post";
import { authRouter } from "~/server/api/routers/auth";
import { appManagementRouter } from "~/server/api/routers/app-management";
import { trafficRouter } from "~/server/api/routers/traffic";
import { openApiRouter } from "~/server/api/routers/openapi";
import { watermarkRouter } from "~/server/api/routers/watermark";
import { userManagementRouter } from "~/server/api/routers/user-management";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
  appManagement: appManagementRouter,
  traffic: trafficRouter,
  openApi: openApiRouter,
  watermark: watermarkRouter,
  userManagement: userManagementRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);