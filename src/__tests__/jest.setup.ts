process.env.NODE_ENV = 'test';

beforeEach(() => {
  jest.setTimeout(60000);
});

afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
});
