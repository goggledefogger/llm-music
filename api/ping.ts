
export default function handler(req: any, res: any) {
  console.log('--- GLOBAL PING ---');
  res.status(200).send('pong');
}
