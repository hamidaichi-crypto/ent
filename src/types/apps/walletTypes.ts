export type GameWallet = {
    id: number
    status: number
    username: string
    ga_username: string
    ga_password?: string // Password might not always be present
    balance: string
    game_provider_id: number
    game_provider_code: string
    game_provider_name: string
    currency_code: string
    reset_password?: boolean
    position?: number
    status_name: string
    provider_type: number
    provider: string // From usage in MemberListTable
    currency: string // From usage in MemberListTable
}

export type WalletInfo = {
    main_wallet: string
    wallets: GameWallet[]
}

export type LoginEvent = {
    id: number
    ip_address: string
    created_at: string
}

export type WalletLog = {
    id: number;
    transaction_type: string;
    amount: string;
    remarks: string | null;
    created_at: string;
    refer_id: number | null;
    created_by: string;
    updated_by: string | null;
    details: string | null;
    status_name: string;
    currency: string;
    balance: string;
    operator: string;
}

export type PromotionLog = {
    id: number;
    freespin_code: string | null;
    member_id: number;
    username: string;
    dummy: number;
    game_provider_code: string;
    promo_code: string;
    bonus_settings: number;
    balance: string;
    status: number;
    settings_currency_id: number;
    rounds: number;
    status_name: string;
    start_datetime: string;
    end_datetime: string;
    currency_code: string;
    amount: string;
    bonus_amount: string;
    target_amount: string;
    accumulated_target_amount: string;
    remarks: string | null;
    created_at: string;
    unlocked_at: string | null;
    updated_at: string;
    updated_by: string;
    promotion_id: number;
    merchant: string;
}
