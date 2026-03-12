import { Router } from "express";
import userRoute from "../modules/user/user.route";
import authRoute from "../modules/auth/auth.route";
import commonRoute from "../modules/common/common.route";
import documentRoute from "../modules/document/document.routes";
import reminderRoute from "../modules/reminder/reminder.route";
import notificationRoute from "../modules/notification/notification.route";
import supportRoute from "../modules/support/support.route";

const appRouter = Router();

const moduleRoutes = [
  {
    path: "/auth",
    router: authRoute,
  },
  {
    path: "/user",
    router: userRoute,
  },
  {
    path: "/common",
    router: commonRoute,
  },
  {
    path: "/document",
    router: documentRoute,
  },
  {
    path: "/reminder",
    router: reminderRoute,
  },
  {
    path: "/notification",
    router: notificationRoute,
  },
  {
    path: "/support",
    router: supportRoute,
  },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.router));

export default appRouter;
