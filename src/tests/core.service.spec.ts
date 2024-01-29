import { Test, TestingModule } from '@nestjs/testing';
import { result } from 'lodash';
import { async } from 'rxjs';
import { DNSResolver } from '@common/DNS-lookup/dns.resolver';
import { WinstonProvider } from '@common/winston/winston.provider';
import { CorePDAsUpcomingActions } from '../core.interface';
import { PoktScanOutput } from '../poktscan/interfaces/pokt-scan.interface';
import { IssuedStakerPDA } from 'src/pda/interfaces/pda.interface';
import { CoreService } from '../core.service';
import { PDAService } from '../pda/pda.service';
import { PoktScanRetriever } from '../poktscan/pokt.retriever';
import exp from 'constants';

jest.mock('@common/winston/winston.provider');
jest.mock('../pda/pda.service');
jest.mock('../poktscan/pokt.retriever');
jest.mock('@common/DNS-lookup/dns.resolver');

describe('CoreService', () => {
  let coreService: CoreService;
  let logger: WinstonProvider;
  let dnsResolver: DNSResolver;
  let poktScanRetriever: PoktScanRetriever;
  let pdaService: PDAService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreService,
        PDAService,
        PoktScanRetriever,
        WinstonProvider,
        DNSResolver,
      ],
    }).compile();

    coreService = module.get<CoreService>(CoreService);
    logger = module.get<WinstonProvider>(WinstonProvider);
    dnsResolver = module.get<DNSResolver>(DNSResolver);
    poktScanRetriever = module.get<PoktScanRetriever>(PoktScanRetriever);
    pdaService = module.get<PDAService>(PDAService);

    jest.clearAllMocks();
  });
  test('Should be defined', () => {
    expect(coreService).toBeDefined();
  });

  describe('setCustodianActions', () => {
    let stakedNodesData: PoktScanOutput;
    let validStakersPDAs: Array<IssuedStakerPDA>;
    let actions: CorePDAsUpcomingActions;

    beforeEach(() => {
      actions = {
        add: [],
        update: [],
      };
      validStakersPDAs = [
        {
          id: 'pda_id',
          status: 'Valid',
          dataAsset: {
            claim: {
              point: 10,
              pdaType: 'staker',
              pdaSubtype: 'Validator',
              type: 'custodian',
              serviceDomain: 'example.comGATEWAY_ID=gatewayID',
              wallets: [
                {
                  address: 'address',
                  amount: 1,
                },
              ],
            },
            owner: {
              gatewayId: 'gatewayID',
            },
          },
        },
      ];
      stakedNodesData = {
        custodian: {
          'example.comGATEWAY_ID=gatewayID': [
            {
              domain: 'example.comGATEWAY_ID=gatewayID',
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
          ],
        },
        non_custodian: {},
      };
    });

    test('Should be defined', () => {
      expect(coreService['setCustodianActions']).toBeDefined();
    });
    // Should update PDA with point 0 when PDA suits with no condition
    test('Should update PDA with point 0 when PDA suits with no service domain', async () => {
      stakedNodesData = {
        custodian: {
          'some domain which is different with PDA service domain ': [
            {
              domain: 'example.comGATEWAY_ID=gatewayID',
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
          ],
        },
        non_custodian: {},
      };
      await coreService['setCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 0,
          wallets: [],
        },
      ]);
    });

    // Should I check other false condirions??!

    test('Should updated PDA with correct parameters when PDA already exists', async () => {
      await coreService['setCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 1000,
          wallets: [{ address: 'wallet_address', amount: 1000 }],
        },
      ]);
    });
    test('Should add PDA with correct parameters when PDA is new', async () => {
      validStakersPDAs = [];
      await coreService['setCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.add).toEqual([
        {
          point: 1000,
          node_type: 'custodian',
          pda_sub_type: 'Validator',
          owner: 'gatewayID',
          serviceDomain: 'example.comGATEWAY_ID=gatewayID',
          wallets: [{ address: 'wallet_address', amount: 1000 }],
        },
      ]);
    });
    test('Should sum staked amount and add all wallets correctly for custodian', async () => {
      stakedNodesData = {
        custodian: {
          'example.comGATEWAY_ID=gatewayID': [
            {
              domain: 'example1.com',
              staked_amount: 1000,
              wallet_address: 'wallet_address1',
            },
            {
              domain: 'example2.com',
              staked_amount: 2000,
              wallet_address: 'wallet_address2',
            },
          ],
        },
        non_custodian: {},
      };
      await coreService['setCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 3000,
          wallets: [
            { address: 'wallet_address1', amount: 1000 },
            { address: 'wallet_address2', amount: 2000 },
          ],
        },
      ]);
    });
    test('Should call getGatewayIDFromDomain method with correct parameter', async () => {
      await coreService['setCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(dnsResolver['getGatewayIDFromDomain']).toHaveBeenCalledWith(
        'example.comGATEWAY_ID=gatewayID',
      );
      expect(dnsResolver['getGatewayIDFromDomain']).toHaveBeenCalledTimes(2);
    });
    // as last test
    test('Should update PDA with point 0 when GATEWAY_ID is not defined', async () => {
      jest
        .spyOn(dnsResolver as any, 'getGatewayIDFromDomain')
        .mockReturnValue(false);
      await coreService['setCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 0,
          wallets: [],
        },
      ]);
    });
  });
  describe('setNonCustodianActions', () => {
    let stakedNodesData: PoktScanOutput;
    let validStakersPDAs: Array<IssuedStakerPDA>;
    let actions: CorePDAsUpcomingActions;

    beforeEach(() => {
      actions = {
        add: [],
        update: [],
      };
      validStakersPDAs = [
        {
          id: 'pda_id',
          status: 'Valid',
          dataAsset: {
            claim: {
              point: 10,
              pdaType: 'staker',
              pdaSubtype: 'Validator',
              type: 'non-custodian',
              serviceDomain: 'example.com',
              wallets: [
                {
                  address: 'example.com',
                  amount: 1000,
                },
              ],
            },
            owner: {
              gatewayId: 'gatewayID',
            },
          },
        },
      ];
      stakedNodesData = {
        custodian: {},
        non_custodian: {
          'example.com': [
            {
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
          ],
        },
      };
    });
    test('Should be defined', () => {
      expect(coreService['setNonCustodianActions']).toBeDefined();
    });
    test('Should update PDA with point 0 when PDA is Invaid', async () => {
      stakedNodesData = {
        custodian: {},
        non_custodian: {
          'someOtherExample.com': [
            {
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
          ],
        },
      };
      await coreService['setNonCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 0,
        },
      ]);
    });
    // Should I check other false condirions??!

    test('Should update PDA with correct parameters when PDA already exists', async () => {
      await coreService['setNonCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 1000,
          wallets: [
            {
              address: 'wallet_address',
              amount: 1000,
            },
          ],
        },
      ]);
    });
    test('Shouls add PDA when PDA is new and Valid', async () => {
      validStakersPDAs = [];
      await coreService['setNonCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.add).toEqual([
        {
          point: 1000,
          node_type: 'non-custodian',
          pda_sub_type: 'Validator',
          owner: 'example.com',
          wallets: [
            {
              address: 'wallet_address',
              amount: 1000,
            },
          ],
        },
      ]);
    });
    test('Should sum staked amount and add all wallets correctly for non-custodian', async () => {
      stakedNodesData = {
        custodian: {},
        non_custodian: {
          'example.com': [
            {
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
            {
              staked_amount: 2000,
              wallet_address: 'wallet_address2',
            },
            {
              staked_amount: 3000,
              wallet_address: 'wallet_address3',
            },
          ],
        },
      };
      await coreService['setNonCustodianActions'](
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
      expect(actions.update).toEqual([
        {
          pda_id: 'pda_id',
          point: 6000,
          wallets: [
            {
              address: 'wallet_address',
              amount: 1000,
            },
            {
              address: 'wallet_address2',
              amount: 2000,
            },
            {
              address: 'wallet_address3',
              amount: 3000,
            },
          ],
        },
      ]);
    });
  });
  describe('getPDAsUpcomingActions', () => {
    let stakedNodesData: PoktScanOutput;
    let validStakersPDAs: Array<IssuedStakerPDA>;
    let actions: CorePDAsUpcomingActions;

    beforeEach(() => {
      actions = {
        add: [],
        update: [],
      };
      validStakersPDAs = [
        {
          id: 'pda_id',
          status: 'Valid',
          dataAsset: {
            claim: {
              point: 10,
              pdaType: 'staker',
              pdaSubtype: 'Validator',
              type: 'custodian',
              serviceDomain: 'example.com',
              wallets: [
                {
                  address: 'example.com',
                  amount: 1000,
                },
              ],
            },
            owner: {
              gatewayId: 'gatewayID',
            },
          },
        },
      ];
      stakedNodesData = {
        custodian: {
          'example.comGATEWAY_ID=gatewayID': [
            {
              domain: 'example.comGATEWAY_ID=gatewayID',
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
          ],
        },
        non_custodian: {
          'example.com': [
            {
              staked_amount: 1000,
              wallet_address: 'wallet_address',
            },
          ],
        },
      };
      jest
        .spyOn(coreService as any, 'setCustodianActions')
        .mockResolvedValue('');
      jest
        .spyOn(coreService as any, 'setNonCustodianActions')
        .mockResolvedValue('');
    });
    test('Should be defined', () => {
      expect(coreService['getPDAsUpcomingActions']).toBeDefined();
    });
    test('Should call setCustodianActions with correct parameters', async () => {
      await coreService['getPDAsUpcomingActions'](
        stakedNodesData,
        validStakersPDAs,
      );
      expect(coreService['setCustodianActions']).toHaveBeenCalledWith(
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
    });
    test('Should call setNonCustodianActions with correct parameters', async () => {
      await coreService['getPDAsUpcomingActions'](
        stakedNodesData,
        validStakersPDAs,
      );
      expect(coreService['setNonCustodianActions']).toHaveBeenCalledWith(
        stakedNodesData,
        validStakersPDAs,
        actions,
      );
    });
    test('Should return actions', async () => {
      expect(
        await coreService['getPDAsUpcomingActions'](
          stakedNodesData,
          validStakersPDAs,
        ),
      ).toEqual(actions);
    });
  });
  describe('handler', () => {
    beforeEach(() => {
      jest.spyOn(coreService as any, 'getPDAsUpcomingActions').mockReturnValue({
        add: [],
        update: [],
      });
    })
    test('Should call issueNewStakerPDA with correct parameters', async () => {
      await coreService.handler();
      expect(pdaService.issueNewStakerPDA).toHaveBeenCalledWith([]);
    });
    test('Should call updateIssuedStakerPDAs with correct parameters', async () => {
       await coreService.handler();
      expect(pdaService.updateIssuedStakerPDAs).toHaveBeenCalledWith([]);
    });
  });
});
