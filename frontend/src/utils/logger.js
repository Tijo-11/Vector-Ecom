import log from "loglevel";

const isDev = process.env.NODE_ENV !== "production";
log.setLevel(isDev ? "debug" : "warn");

export default log;
//production";
