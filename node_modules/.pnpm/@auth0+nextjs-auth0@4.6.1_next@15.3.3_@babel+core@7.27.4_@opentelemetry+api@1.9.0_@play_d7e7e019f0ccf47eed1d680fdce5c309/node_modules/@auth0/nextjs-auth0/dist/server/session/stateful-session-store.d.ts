import { SessionData, SessionDataStore } from "../../types";
import * as cookies from "../cookies";
import { AbstractSessionStore, SessionCookieOptions } from "./abstract-session-store";
interface StatefulSessionStoreOptions {
    secret: string;
    rolling?: boolean;
    absoluteDuration?: number;
    inactivityDuration?: number;
    store: SessionDataStore;
    cookieOptions?: SessionCookieOptions;
}
export declare class StatefulSessionStore extends AbstractSessionStore {
    store: SessionDataStore;
    constructor({ secret, store, rolling, absoluteDuration, inactivityDuration, cookieOptions }: StatefulSessionStoreOptions);
    get(reqCookies: cookies.RequestCookies): Promise<SessionData | null>;
    set(reqCookies: cookies.RequestCookies, resCookies: cookies.ResponseCookies, session: SessionData, isNew?: boolean): Promise<void>;
    delete(reqCookies: cookies.RequestCookies, resCookies: cookies.ResponseCookies): Promise<void>;
}
export {};
