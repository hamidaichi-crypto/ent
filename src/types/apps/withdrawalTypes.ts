// Type Imports
import type { ThemeColor } from '@core/types'

type risk_profile = {
    risk_score: number,
    color: string,
}


export type WithdrawalType = {
    id: number,
    member_id: number,
    username: string,
    name: string,
    bo_user_id: number,
    suspicious: number,
    dummy: number,
    payment_method: string,
    payment_gateway: string,
    site_id: number,
    merchant_name: string,
    status: number,
    status_name: string,
    member_group: string,
    color: string,
    currency: string,
    amount: string,
    processing_fee: string,
    member_processing_fee: string,
    confirmed_amount: string,
    member_bank: string,
    member_bank_account: string,
    token: string,
    network: string,
    crypto_wallet_address: string,
    crypto_wallet_nickname: string,
    is_crypto: number,
    cr_amount: string,
    cr_processing_fee: string,
    cr_member_processing_fee: string,
    cr_confirmed_amount: string,
    cr_exchange_rate: string,
    mobile_number: string,
    ifsc: string,
    remarks: string,
    created_at: string,
    updated_at: string,
    approved_at: string,
    updated_by: string,
    created_by: string,
    approved_by: string,
    unusual_callback: number,
    processing_time: string,
    bank_transactions: [],
    risk_score: string, // not available
    grade: string, // not available
    confirm_account: string, // not available
    handler: string // not available    
    risk_profile: risk_profile,
    cross_bettings_count: number

    //   avatarColor?: ThemeColor
}


export interface BankTransaction {
    merchant_bank_id: number;
    merchant_bank: string;
    merchant_bank_account: string;
    processing_fee: string;
    // add other nested fields if needed
}

export interface CrossBettingTransaction {
    member_account_id: string;
    username: string;
    game_provider_code: string;
    game_round_no: string;
    game_code: string;
    game_name: string;
    game_type: string;
    bet_type: string;
    bet_choice: string;
    bet_amount: string;
    ticket_time: string;
    // add other nested fields if needed
}

export interface Transaction {
    id: number;
    amount: string;
    approved_at: string;
    approved_by: string;
    auto_deposit_flag: number;
    bank_transactions: BankTransaction[];
    bo_user_id: number;
    color: string;
    confirmed_amount: string;
    cr_amount: string;
    cr_confirmed_amount: string;
    cr_exchange_rate: number | null;
    cr_member_processing_fee: string;
    cr_processing_fee: string;
    created_at: string;
    created_by: string;
    crypto_wallet_address: string;
    crypto_wallet_nickname: string;
    currency: string;
    dummy: number;
    ifsc: string | null;
    is_crypto: number;
    member_bank: string;
    member_bank_account: string;
    member_group: string;
    member_id: number;
    member_processing_fee: string;
    merchant_name: string;
    mobile_number: string;
    name: string;
    network: string | null;
    payment_gateway: string | null;
    payment_method: string;
    processing_fee: string;
    processing_time: string;
    remarks: string | null;
    site_id: number;
    status: number;
    status_name: string;
    suspicious: number;
    token: string | null;
    unusual_callback: number;
    updated_at: string;
    updated_by: string;
    username: string;
}

