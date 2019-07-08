import Connection from '../src/classes/Connection';

(async () => {

  const conn = new Connection({
    clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
    clientSecret: '9154137956044345875',
    redirectUri: 'http://localhost:3000/oauth/_callback'
  });

  const resp = await conn.authenticate({
    username: process.env.SFUSER,
    password: process.env.SFPASS
  });

  // tslint:disable-next-line:no-console
  console.log(resp);

})();
