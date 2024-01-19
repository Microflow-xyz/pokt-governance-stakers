import {
  BuilderPDASubType,
  CitizenPDASubType,
  PDAType,
  StakerPDASubType,
  StakerPDAType,
} from '../types/pda.type';

interface PDAClaimBase<Type extends PDAType> {
  point: number;
  pdaType: Type;
  pdaSubtype: Type extends 'citizen'
    ? CitizenPDASubType
    : Type extends 'builder'
      ? BuilderPDASubType
      : StakerPDASubType;
}

interface StakerPDAClaim {
  type: StakerPDAType;
}
export interface IssuedPDA {
  id: string;
  status: 'Valid' | 'Suspended' | 'Revoked' | 'Expired';
  dataAsset: {
    claim:
      | PDAClaimBase<'citizen'>
      | PDAClaimBase<'builder'>
      | (PDAClaimBase<'staker'> & StakerPDAClaim);
    owner: {
      gatewayId: string;
    };
  };
}

export interface IssuedStakerPDA extends IssuedPDA {
  dataAsset: {
    claim: PDAClaimBase<'staker'> & StakerPDAClaim;
    owner: {
      gatewayId: string;
    };
  };
}

export interface IssuedPDAsResponse {
  data: {
    issuedPDAs: Array<IssuedPDA>;
  };
}

export interface IssuedPDAsVariables {
  org_gateway_id: string;
  take: number;
  skip: number;
}

export interface IssuedPDACountResponse {
  data: {
    issuedPDAsCount: number;
  };
}

export interface IssuedPDACountVariables {
  org_gateway_id: string;
}

export interface IssueNewStakerPDAVariables {
  org_gateway_id: string;
  data_model_id: string;
  owner: string;
  claim: PDAClaimBase<'staker'> & StakerPDAClaim;
}

export interface IssueNewStakerPDAResponse {
  data: {
    createPDA: {
      id: string;
    };
  };
}

export interface UpdateStakerPDAVariables {
  pda_id: string;
  point: number;
}

export interface UpdateStakerPDAResponse {
  data: {
    updatePDA: {
      id: string;
    };
  };
}
