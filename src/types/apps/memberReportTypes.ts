// Type Imports
export type MemberReportType = {
    id: number
    currency_code: string | null
    game_provider_code: string | null
    username: string | null
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
