export const DNSResolver = jest.fn().mockReturnValue({
  getGatewayIDFromDomain: jest.fn(() => {
    return false;
  }),
  getTXTRecords: jest.fn(),
});
