'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { MemberReportType, GameResultType } from '@/types/apps/memberReportTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { formatDateTime } from '@/utils/dateFormatter'
import { useFetchData } from '@/utils/api' // Corrected import for the hook

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

type MembersTypeWithAction = MemberReportType & {
    action?: string
}

type UserRoleType = {
    [key: string]: { icon: string; color: string }
}

type UserStatusType = {
    [key: string]: ThemeColor
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}

const DebouncedInput = ({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
    // States
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Column Definitions
const columnHelper = createColumnHelper<MembersTypeWithAction>()

type PaginationData = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

const formatCurrency = (amount: number | string | null | undefined, alignRight: boolean = true) => {
    if (amount === null || amount === undefined) {
        return <Typography variant="body2" sx={{ textAlign: alignRight ? 'right' : 'left', color: 'text.primary' }}>0.00</Typography>;
    }
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) {
        return <Typography variant="body2" sx={{ textAlign: alignRight ? 'right' : 'left', color: 'text.primary' }}>0.00</Typography>;
    }
    const color = num < 0 ? 'error.main' : 'text.primary';
    return <Typography variant="body2" sx={{ textAlign: alignRight ? 'right' : 'left', color: color }}>{num.toFixed(2)}</Typography>;
};

// --- User Game Result Modal ---
const UserGameResultModal = ({
    username,
    userId,
    gameProviderCode,
    gameAccount,
    open,
    startDate,
    endDate,
    onClose
}: {
    username: string | null
    userId: number | null
    gameProviderCode: string | null
    gameAccount: string | null
    startDate: string | null
    endDate: string | null
    open: boolean
    onClose: () => void
}) => {
    const [gameResults, setGameResults] = useState<GameResultType[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 30
    })
    const [total, setTotal] = useState(0)
    const fetchData = useFetchData()

    // Fetch game results when modal opens
    useEffect(() => {
        const loadGameResults = async () => {
            if (!username || !open) return
            setLoading(true)
            setError(null)
            try {
                const page = pagination.pageIndex + 1
                const perPage = pagination.pageSize
                const response =
                    await fetchData(`/members/game_results?username=${username}&start_date=${startDate}&end_date=${endDate}&user_id=${userId}&game_provider_code=${gameProviderCode}&page=${page}`)
                setGameResults(response?.data?.rows || [])
                setTotal(response?.data?.paginations?.total || 0)
            } catch (err) {
                console.error(err)
                setError('Failed to load game results.')
            } finally {
                setLoading(false)
            }
        }
        loadGameResults()
    }, [username, open, fetchData, pagination.pageIndex, pagination.pageSize])

    const gameResultColumnHelper = createColumnHelper<GameResultType>()

    const gameResultColumns = useMemo<ColumnDef<GameResultType, any>[]>(() => [
        gameResultColumnHelper.accessor('ticket_id', { header: 'Ticket ID', cell: ({ row }) => <Typography variant="body2">{row.original.ticket_id}</Typography>, size: 120 }),
        gameResultColumnHelper.accessor('ticket_time', { header: 'Ticket Time', cell: ({ row }) => <Typography variant="body2">{formatDateTime(row.original.ticket_time)}</Typography>, size: 150 }),
        gameResultColumnHelper.accessor('settlement_time', { header: 'Settlement Time', cell: ({ row }) => <Typography variant="body2">{formatDateTime(row.original.settlement_time)}</Typography>, size: 150 }),
        gameResultColumnHelper.accessor('game_type', { header: 'Game Type', cell: ({ row }) => <Typography variant="body2">{row.original.game_type}</Typography>, size: 100 }),
        gameResultColumnHelper.accessor('game_name', { header: 'Game Name', cell: ({ row }) => <Typography variant="body2">{row.original.game_name}</Typography>, size: 150 }),
        gameResultColumnHelper.accessor('bet_amount', { header: 'Bet Amount', cell: ({ row }) => formatCurrency(row.original.bet_amount), size: 100 }),
        gameResultColumnHelper.accessor('win_lose', { header: 'Win/Lose', cell: ({ row }) => formatCurrency(row.original.win_lose), size: 100 }),
        gameResultColumnHelper.accessor('valid_bet', { header: 'Valid Bet', cell: ({ row }) => formatCurrency(row.original.valid_bet), size: 100 }),
        gameResultColumnHelper.accessor('transaction_status', { header: 'Status', cell: ({ row }) => <Typography variant="body2">{row.original.transaction_status}</Typography>, size: 100 }),
        gameResultColumnHelper.accessor('game_round_no', { header: 'Game Round No', cell: ({ row }) => <Typography variant="body2">{row.original.game_round_no}</Typography>, size: 120 }),
        gameResultColumnHelper.accessor('is_trigger_free_spin', { header: 'Trigger Free Spin', cell: ({ row }) => <Typography variant="body2">{row.original.is_trigger_free_spin ? 'Yes' : 'No'}</Typography>, size: 120 }),
        gameResultColumnHelper.accessor('is_buy_free_spin', { header: 'Buy Free Spin', cell: ({ row }) => <Typography variant="body2">{row.original.is_buy_free_spin ? 'Yes' : 'No'}</Typography>, size: 120 }),
        gameResultColumnHelper.accessor('result_url', {
            header: 'Result URL',
            cell: ({ row }) => row.original.result_url ? (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                // onClick={() => window.open(row.original.result_url, '_blank')}
                >
                    Details
                </Button>
            ) : (
                '-'
            )
        })
    ], [])

    const table = useReactTable({
        data: gameResults,
        columns: gameResultColumns,
        filterFns: { fuzzy: fuzzyFilter },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: Math.ceil(total / pagination.pageSize),
        onPaginationChange: setPagination,
        state: {
            pagination
        },
    })

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            sx={{ '& .MuiDialog-paper': { height: '80vh' } }}
        >
            <DialogTitle className="flex justify-between items-center">
                {gameProviderCode} Bet Logs: {username} | {gameAccount} | {startDate} - {endDate}
                <IconButton onClick={onClose} className="absolute block-start-4 inline-end-4">
                    <i className="ri-close-line" />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pb: 4 }}>
                {loading ? (
                    <Typography>Loading...</Typography>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : gameResults.length === 0 ? (
                    <Typography>No game results found.</Typography>
                ) : (
                    <>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Detailed Bet Histories
                        </Typography>
                        <div className="overflow-x-auto">
                            <table className={tableStyles.table}>
                                <thead>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th key={header.id}>
                                                    {header.isPlaceholder ? null : (
                                                        <div
                                                            className={classnames({
                                                                'flex items-center': header.column.getIsSorted(),
                                                                'cursor-pointer select-none': header.column.getCanSort()
                                                            })}
                                                            onClick={header.column.getToggleSortingHandler()}
                                                        >
                                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                                            {{
                                                                asc: <i className='ri-arrow-up-s-line text-xl' />,
                                                                desc: <i className='ri-arrow-down-s-line text-xl' />
                                                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                                        </div>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            rowsPerPageOptions={[]}
                            component="div"
                            className="border-bs"
                            count={total}
                            rowsPerPage={pagination.pageSize}
                            page={pagination.pageIndex}
                            onPageChange={(_, newPage) => setPagination(prev => ({ ...prev, pageIndex: newPage }))}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}



const MemberReportListTable = ({
    tableData,
    paginationData,
    onPageChange,
    onRowsPerPageChange,
    filters,
    onFilterChange,
    onClear,
    onSearch // Receive onSearch prop
}: {
    tableData?: MemberReportType[]
    paginationData: PaginationData
    onPageChange: (page: number) => void
    onRowsPerPageChange: (perPage: number) => void
    filters: {
        username: string
        startDate: string
        endDate: string
    }
    onFilterChange: (newFilters: {
        username: string
        startDate: string
        endDate: string
    }) => void
    onClear: () => void
    onSearch: () => void // Add onSearch prop
}) => {
    // States
    const [addUserOpen, setAddUserOpen] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
    const [selectedUsernameId, setSelectedUsernameId] = useState<number | null>(null)
    const [selectedGameProviderCode, setSelectedGameProviderCode] = useState<string | null>(null)
    const [selectedGameAccount, setSelectedGameAccount] = useState<string | null>(null)



    // Hooks
    const { lang: locale } = useParams()


    const columns = useMemo<ColumnDef<MembersTypeWithAction, any>[]>(
        () => [
            // --- Standalone top-level columns ---
            {
                header: 'Currency',
                accessorKey: 'currency_code',
                cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'center' }}>{row.original.currency_code}</Typography>,
                size: 80
            },
            {
                header: 'Game Provider',
                accessorKey: 'game_provider_code',
                cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'center' }}>{row.original.game_provider_code}</Typography>,
                size: 120
            },
            {
                header: 'Username',
                accessorKey: 'username',
                size: 150,
                cell: ({ row }) => (
                    <Typography
                        variant="body2"
                        className='cursor-pointer'
                        onClick={() => {
                            setSelectedUsername(row.original.username)
                            setSelectedUsernameId(row.original.member_account_id)
                            setSelectedGameProviderCode(row.original.game_provider_code)
                            setSelectedGameAccount(row.original.game_account)
                            setIsUserDetailModalOpen(true)
                        }}
                        sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' }, textAlign: 'center' }}
                    >{row.original.game_account}</Typography>
                )
            },

            // --- Group: Transfer ---
            {
                header: 'Transfer',
                columns: [
                    {
                        header: 'Total In Count',
                        accessorKey: 'total_in_count',
                        cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_transfer_in}</Typography>, // Assuming count is integer, no decimal formatting
                        size: 120
                    },
                    {
                        header: 'Total In Amount',
                        accessorKey: 'total_in_amount',
                        cell: ({ row }) => formatCurrency(row.original.total_transfer_in_amount),
                        size: 120
                    },
                    {
                        header: 'Total Out Count',
                        accessorKey: 'total_out_count',
                        cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_transfer_out}</Typography>, // Assuming count is integer
                        size: 120
                    },
                    {
                        header: 'Total Out Amount',
                        accessorKey: 'total_out_amount',
                        cell: ({ row }) => formatCurrency(row.original.total_transfer_out_amount),
                        size: 120
                    }
                ]
            },

            // --- Group: Deposit ---
            {
                header: 'Deposit',
                columns: [
                    {
                        header: 'Total Deposit Count',
                        accessorKey: 'total_deposit_count',
                        cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_deposit}</Typography>, // Assuming count is integer
                        size: 120
                    },
                    {
                        header: 'Total Deposit Amount',
                        accessorKey: 'total_deposit_amount',
                        cell: ({ row }) => formatCurrency(row.original.total_deposit),
                        size: 120
                    }
                ]
            },

            // --- Group: Withdrawal ---
            {
                header: 'Withdrawal',
                columns: [
                    {
                        header: 'Total Withdrawal Count',
                        accessorKey: 'total_withdrawal_count',
                        cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_number_of_withdrawal}</Typography>, // Assuming count is integer
                        size: 120
                    },
                    {
                        header: 'Total Withdrawal Amount',
                        accessorKey: 'total_withdrawal_amount',
                        cell: ({ row }) => formatCurrency(row.original.total_withdrawal),
                        size: 120
                    }
                ]
            },

            // --- Group: Company Processing Fee ---
            {
                header: 'Company Processing Fee',
                columns: [
                    {
                        header: 'Total Cash Out Fee',
                        accessorKey: 'total_cash_out_fee',
                        cell: ({ row }) => formatCurrency(row.original.total_cashout_fee),
                        size: 120
                    },
                    {
                        header: 'Total Deposit Processing Fee',
                        accessorKey: 'total_deposit_processing_fee',
                        cell: ({ row }) => formatCurrency(row.original.total_deposit_processing_fee),
                        size: 150
                    },
                    {
                        header: 'Total Withdrawal Processing Fee',
                        accessorKey: 'total_withdrawal_processing_fee',
                        cell: ({ row }) => formatCurrency(row.original.total_withdrawal_processing_fee),
                        size: 150
                    }
                ]
            },

            // --- Group: Bets ---
            {
                header: 'Bets',
                columns: [
                    {
                        header: 'Total Bet Count',
                        accessorKey: 'total_bet_count',
                        cell: ({ row }) => <Typography variant="body2" sx={{ textAlign: 'right' }}>{row.original.total_bet_count}</Typography>, // Assuming count is integer
                        size: 120
                    },
                    {
                        header: 'Total Bet Amount',
                        accessorKey: 'total_bet_amount',
                        cell: ({ row }) => formatCurrency(row.original.total_bet_amount),
                        size: 120
                    },
                    {
                        header: 'Total Valid Bet Amount',
                        accessorKey: 'total_valid_bet_amount',
                        cell: ({ row }) => formatCurrency(row.original.total_valid_bet_amount),
                        size: 120
                    },
                    {
                        header: 'Player W/L',
                        accessorKey: 'player_win_loss',
                        cell: ({ row }) => formatCurrency(row.original.win_lose),
                        size: 120
                    },
                    {
                        header: 'Total Jackpot Contribution',
                        accessorKey: 'total_jackpot_contribution',
                        cell: ({ row }) => formatCurrency(row.original.total_jackpot_contribution),
                        size: 150
                    },
                    {
                        header: 'Total Jackpot Win',
                        accessorKey: 'total_jackpot_win',
                        cell: ({ row }) => formatCurrency(row.original.total_jackpot_win),
                        size: 120
                    },
                    {
                        header: 'Nett Jackpot',
                        accessorKey: 'nett_jackpot',
                        cell: ({ row }) => formatCurrency(row.original.nett_jackpot),
                        size: 120
                    },
                    {
                        header: 'Game Bet Amount',
                        accessorKey: 'game_bet_amount',
                        cell: ({ row }) => formatCurrency(row.original.game_bet_amount),
                        size: 120
                    },
                    {
                        header: 'Gross Game Revenue (GGR)',
                        accessorKey: 'gross_game_revenue',
                        cell: ({ row }) => formatCurrency(row.original.gross_game_revenue),
                        size: 150
                    }
                ]
            }
        ],
        [tableData]
    )

    const groupColors: { [key: string]: string } = {
        'Transfer': '#e0f2f7', // Light blue
        'Deposit': '#e8f5e9',  // Light green
        'Withdrawal': '#ffebee', // Light red
        'Company Processing Fee': '#fff3e0', // Light orange
        'Bets': '#f3e5f5', // Light purple
    };

    const groupTextColors: { [key: string]: string } = {
        'Transfer': '#01579b', // Darker blue
        'Deposit': '#2e7d32',  // Darker green
        'Withdrawal': '#c62828', // Darker red
        'Company Processing Fee': '#e65100', // Darker orange
        'Bets': '#6a1b9a', // Darker purple
    };



    const table = useReactTable({
        data: tableData ?? [],
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            rowSelection,
            globalFilter,
            pagination: {
                pageIndex: paginationData.current_page - 1,
                pageSize: paginationData.per_page
            }
        },
        enableRowSelection: true, //enable row selection for all rows
        // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        manualPagination: true // We'll handle pagination ourselves
    })

    return (
        <>
            <Card>
                <CardHeader title='Member Report' className='pbe-4' />
                <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onSearch} onClear={onClear} />
                <Divider />

                <div className="overflow-x-auto">
                    <table className={tableStyles.table} style={{ tableLayout: 'fixed' }}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        const columnSize = header.getSize();
                                        const widthStyle = columnSize ? { width: columnSize, minWidth: columnSize } : undefined;

                                        return (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                style={{
                                                    ...widthStyle,
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle',
                                                    backgroundColor: (() => {
                                                        if ('columns' in header.column.columnDef && header.column.columnDef.columns && typeof header.column.columnDef.header === 'string') {
                                                            return groupColors[header.column.columnDef.header as string] || 'inherit';
                                                        } else {
                                                            const parentGroupHeader = header.column.parent?.columnDef?.header;
                                                            if (typeof parentGroupHeader === 'string') {
                                                                return groupColors[parentGroupHeader] || 'inherit';
                                                            }
                                                        }
                                                        return 'inherit';
                                                    })(),
                                                    color: (() => {
                                                        if ('columns' in header.column.columnDef && header.column.columnDef.columns && typeof header.column.columnDef.header === 'string') {
                                                            return groupTextColors[header.column.columnDef.header as string] || 'inherit';
                                                        } else {
                                                            const parentGroupHeader = header.column.parent?.columnDef?.header;
                                                            if (typeof parentGroupHeader === 'string') {
                                                                return groupTextColors[parentGroupHeader] || 'inherit';
                                                            }
                                                        }
                                                        return 'inherit';
                                                    })(),
                                                    borderRight: (() => {
                                                        const parentGroupHeader = header.column.parent?.columnDef?.header;
                                                        if ('columns' in header.column.columnDef && header.column.columnDef.columns && typeof header.column.columnDef.header === 'string') {
                                                            return '2px solid #fff';
                                                        } else if (typeof parentGroupHeader === 'string') {
                                                            const groupColumns = header.column.parent?.columns || [];
                                                            const isLastInGroup = groupColumns[groupColumns.length - 1].id === header.column.id;
                                                            return isLastInGroup ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)';
                                                        }
                                                        return '1px solid rgba(0,0,0,0.1)';
                                                    })()
                                                }}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={classnames({
                                                            'flex items-center justify-center gap-1': true,
                                                            'cursor-pointer select-none': header.column.getCanSort(),
                                                        })}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        <span style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>
                                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                                        </span>
                                                        {{
                                                            asc: <i className='ri-arrow-up-s-line text-xl' />,
                                                            desc: <i className='ri-arrow-down-s-line text-xl' />,
                                                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                                    </div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>

                        {table.getRowModel().rows.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                        No data available
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                        {row.getVisibleCells().map(cell => {
                                            const columnSize = cell.column.getSize();
                                            const widthStyle = columnSize ? { width: columnSize, minWidth: columnSize } : undefined;
                                            return (
                                                <td key={cell.id} style={widthStyle}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>

                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component='div'
                    className='border-bs'
                    count={paginationData.total}
                    rowsPerPage={paginationData.per_page}
                    page={paginationData.current_page - 1}
                    SelectProps={{
                        inputProps: { 'aria-label': 'rows per page' }
                    }}
                    onPageChange={(_, page) => {
                        onPageChange(page + 1)
                    }}
                    onRowsPerPageChange={e => onRowsPerPageChange(Number(e.target.value))}
                />
            </Card>
            <UserGameResultModal
                username={selectedUsername}
                userId={selectedUsernameId}
                startDate={filters.startDate}
                endDate={filters.endDate}
                gameProviderCode={selectedGameProviderCode}
                gameAccount={selectedGameAccount}
                open={isUserDetailModalOpen}
                onClose={() => {
                    setIsUserDetailModalOpen(false)
                    setSelectedUsername(null)
                }}
            />
        </>
    )
}

export default MemberReportListTable
