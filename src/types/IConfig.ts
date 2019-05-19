export interface IConfig {
  database: string;
  web: {
    JWTSecret: string;
    captchaSecret: string;
    ports: {
      http: number;
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
