// Type Imports
export type MemberReportType = {
    id: number
    currency_code: string | null
    game_provider_code: string | null
    member_account_id: number | null
    username: string | null
    merchant: number | null,
    dummy: number | null
    game_account: string | null
    total_number_of_transfer_in: number
    total_transfer_in_amount: number
    total_number_of_transfer_out: number
    total_transfer_out_amount: number
    total_number_of_deposit: number
    total_deposit: number
    total_number_of_withdrawal: number
    total_withdrawal: number
    total_bet_count: number
    total_bet_amount: number
    total_valid_bet_amount: number
    win_lose: number
    total_jackpot_contribution: number
    total_jackpot_win: number
    nett_jackpot: number
    game_bet_amount: number
    gross_game_revenue: number
    total_manual_bonus: number
    total_deposit_bonus: number
    total_free_credit: number
    total_free_spin: number
    total_bonus: number
    total_cancelled_bonus: number
    total_rebate: number
    total_cashout_fee: number
    total_deposit_processing_fee: number
    total_withdrawal_processing_fee: number
    total_turnover: number
    net_game_revenue: number
}

export type GameResultType = {
    ticket_id: string;
    ticket_time: string;
    settlement_time: string;
    game_type: string;
    game_name: string;
    bet_amount: string;
    win_lose: string;
    valid_bet: string;
    transaction_status: string;
    game_round_no: number;
    is_trigger_free_spin: boolean;
    is_buy_free_spin: boolean;
    result_url: string | null;
}
