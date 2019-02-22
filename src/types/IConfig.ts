export interface IConfig {
  database: string;
  ssl: {
    key: string;
    cert: string;
  };
  web: {
    JWTSecret: string;
    captchaSecret: string;
    ports: {
      http: number;
      https: number;
    };
    host: string;
    motd: string;
  };
  email: {
    user: string;
    password: string;
    host: string;
    port: number;
    from: string;
  };
  defaultGroup: string;
  socket: {
    maxFileSize: number;
  };
  simpleCoreSecret: string;
}
