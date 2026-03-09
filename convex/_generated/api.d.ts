/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as news from "../news.js";
import type * as openai from "../openai.js";
import type * as podcast from "../podcast.js";
import type * as seedThemes from "../seedThemes.js";
import type * as themeActions from "../themeActions.js";
import type * as themes from "../themes.js";
import type * as trendsCron from "../trendsCron.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  files: typeof files;
  http: typeof http;
  news: typeof news;
  openai: typeof openai;
  podcast: typeof podcast;
  seedThemes: typeof seedThemes;
  themeActions: typeof themeActions;
  themes: typeof themes;
  trendsCron: typeof trendsCron;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
