// Type Imports
import type { ThemeColor } from '@core/types'

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
    handler: string, // not available
    handler: string, // not available

    //   avatarColor?: ThemeColor
}
