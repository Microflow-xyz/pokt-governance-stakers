import { IssuePDAJob, UpdatePDAJob } from '../interfaces/pda.interface';

export type PDAType = 'citizen' | 'builder' | 'staker';
export type UserAuthenticationChain = 'EVM' | 'POKT' | 'SOL';

export type CitizenPDASubType = 'POKT DNA' | 'POKT DAO';

export type BuilderPDASubType =
  | 'Protocol Builder'
  | 'Priority Builder'
  | 'Socket Builder'
  | 'Proposal Builder'
  | 'Bounty Hunter'
  | 'Thought Leader'
  | 'DAO Scholar'
  | 'OG Governor';

export type StakerPDASubType = 'Validator' | 'Liquidity Provider' | 'Gateway';
export type StakerPDAType = 'custodian' | 'non-custodian';

export type PDAJob = IssuePDAJob | UpdatePDAJob;
