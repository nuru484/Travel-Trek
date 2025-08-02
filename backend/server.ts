// server.ts
import app from './app';
import ENV from './src/config/env';

const port = ENV.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening on http://localhost:${port}`);
});
