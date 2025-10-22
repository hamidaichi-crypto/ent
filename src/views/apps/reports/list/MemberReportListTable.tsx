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
import type { MemberReportType } from '@/types/apps/memberReportTypes'
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

// --- User Detail Modal Component ---
const UserDetailModal = ({
    username,
    open,
    onClose
}: { username: string | null; open: boolean; onClose: () => void }) => {
    const [userData, setUserData] = useState<MemberReportType | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fetchData = useFetchData()

    // 🗂 Cache user data by username
    const cacheRef = useRef<Record<string, MemberReportType>>({})

    // Fetch user details (and update cache)
    const loadUserData = async (uname: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchData(`/members/u/${uname}`)
            console.log("response")
            console.log(response)
            setUserData(response?.data)
            cacheRef.current[uname] = response // ✅ cache it
        } catch (err) {
            console.error('Error fetching user data:', err)
            setError('Failed to load user data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!open || !username) return

        // ✅ If cached, use it immediately
        if (cacheRef.current[username]) {
            setUserData(cacheRef.current[username])
            setLoading(false)
            setError(null)
        } else {
            // Otherwise fetch from API
            loadUserData(username)
        }
    }, [username, open])

    // Don’t clear cache on close → only reset modal state
    useEffect(() => {
        if (!open) {
            setError(null)
            setLoading(false)
            setUserData(null) // clear local state, but keep cache
        }
    }, [open])

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                User Details {username ? `- ${username}` : ''}
            </DialogTitle>
            <DialogContent>
                {loading && <Typography>Loading...</Typography>}
                {error && <Typography color="error">{error}</Typography>}
                {userData && (
                    <>
                        <Typography variant="h6">Name: {userData.name}</Typography>
                        <Typography>Username: {userData.username}</Typography>
                        <Typography>Email: {userData.email}</Typography>
                        <Typography>Score: {userData.score ?? '-'}</Typography>
                        <Typography>Grade: {userData.grade ?? '-'}</Typography>
                        <Typography>
                            Birthday: {formatDateTime(userData.date_of_birth)}
                        </Typography>
                        <Typography>Mobile: {userData.mobile}</Typography>
                        <Typography>Member Group: {userData.member_group_id}</Typography>
                        <Typography>Status: {userData.status}</Typography>
                        <Typography>Refer By: {userData.referrer}</Typography>
                        <Typography>Remark: {userData.remark ?? '-'}</Typography>
                        <Typography>
                            Registration Date:{' '}
                            {formatDateTime(userData.registration_created_at)}
                        </Typography>
                        <Typography>Registration IP: {userData.registration_ip}</Typography>
                        <Typography>
                            Registration Domain: {userData.registration_site}
                        </Typography>
                    </>
                )}

                {/* ✅ Refresh button */}
                {username && (
                    <Button
                        onClick={() => loadUserData(username)}
                        variant="outlined"
                        className="mt-2 mr-2"
                    >
                        Refresh
                    </Button>
                )}

                <Button onClick={onClose} variant="contained" className="mt-2">
                    Close
                </Button>
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
    onSearch: () => void // Add onSearch prop
}) => {
    // States
    const [addUserOpen, setAddUserOpen] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

    // Hooks
    const { lang: locale } = useParams()

    // const columns = useMemo<ColumnDef<MembersTypeWithAction, any>[]>(
    //     () => {
    //         // const registrationDomainColumn = columnHelper.accessor('registration_site', {
    //         //     header: 'Registration Domain',
    //         //     cell: ({ row }) => <Typography>{row.original.registration_site}</Typography>,
    //         // });

    //         // const registrationIpColumn = columnHelper.accessor('registration_ip', {
    //         //     header: 'Registration IP Address',
    //         //     cell: ({ row }) => <Typography>{row.original.registration_ip}</Typography>,
    //         //     meta: {
    //         //         pinned: 'right'
    //         //     }
    //         // });

    //         const otherColumns = [
    //             columnHelper.accessor('currency_code', {
    //                 header: 'Currency',
    //                 cell: ({ row }) => <Typography>{row.original.currency_code}</Typography>
    //             }),
    //             columnHelper.accessor('game_provider_code', {
    //                 header: 'Merchant',
    //                 cell: ({ row }) => <Typography>{row.original.game_provider_code}</Typography>
    //             }),
    //             columnHelper.accessor('username', {
    //                 header: 'Username',
    //                 cell: ({ row }) => (
    //                     <div className='flex items-center gap-0.5'>
    //                         <IconButton size='small' onClick={() => {
    //                             setSelectedUsername(row.original.username)
    //                             setIsUserDetailModalOpen(true)
    //                         }}>
    //                             <Typography>{row.original.username}</Typography>
    //                         </IconButton>
    //                     </div>
    //                 ),
    //                 enableSorting: false,
    //                 meta: {
    //                     pinned: 'left'
    //                 }
    //             }),
    //             // columnHelper.accessor('id', {
    //             //     header: 'Member ID',
    //             //     cell: ({ row }) => <Typography>{row.original.id}</Typography>
    //             // }),
    //             // columnHelper.accessor('username', {
    //             //     header: 'User Name',
    //             //     cell: ({ row }) => (
    //             //         <Typography
    //             //             className='cursor-pointer'
    //             //             onClick={() => {
    //             //                 setSelectedUsername(row.original.username)
    //             //                 setIsUserDetailModalOpen(true)
    //             //             }}
    //             //         >
    //             //             {row.original.username}
    //             //         </Typography>
    //             //     )
    //             // }),
    //             // columnHelper.accessor('score', {
    //             //     header: 'Score',
    //             //     cell: ({ row }) => <Typography> - </Typography>
    //             // }),
    //             // columnHelper.accessor('grade', {
    //             // }),
    //             // columnHelper.accessor('mobile', {
    //             //     header: 'Mobile No',
    //             //     cell: ({ row }) => <Typography>{row.original.mobile}</Typography>
    //             // }),
    //             // columnHelper.accessor('member_group_id', {
    //             //     header: 'Member Group',
    //             //     cell: ({ row }) => <Typography>{row.original.member_group_id}</Typography>
    //             // }),
    //             // columnHelper.accessor('status', {
    //             //     header: 'Status',
    //             //     cell: ({ row }) => <Typography>{row.original.status}</Typography>
    //             // }),
    //             // columnHelper.accessor('referrer', {
    //             //     header: 'Refer By',
    //             //     cell: ({ row }) => <Typography>{row.original.referrer}</Typography>
    //             // }),
    //             // columnHelper.accessor('remark', {
    //             //     header: 'Remark',
    //             //     cell: ({ row }) => <Typography> - </Typography>
    //             // }),
    //             // columnHelper.accessor('registration_created_at', {
    //             //     header: 'Registration Date',
    //             //     cell: ({ row }) => <Typography>{formatDateTime(row.original.registration_created_at)}</Typography>
    //             // }),
    //             // columnHelper.accessor('registration_ip', {
    //             //     header: 'Registration IP Address',
    //             //     cell: ({ row }) => <Typography>{row.original.registration_ip}</Typography>
    //             // }),
    //         ];

    //         return [
    //             ...otherColumns,
    //             // registrationDomainColumn, 
    //             // registrationIpColumn
    //         ];
    //     },
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    //     [tableData, locale, isUserDetailModalOpen, selectedUsername] // Added dependencies for modal state
    // )

    const columns = useMemo<ColumnDef<MembersTypeWithAction, any>[]>(
        () => [
            // --- Standalone top-level columns ---
            {
                header: 'Currency',
                accessorKey: 'currency_code',
                cell: ({ row }) => <Typography>{row.original.currency_code}</Typography>
            },
            {
                header: 'Merchant',
                accessorKey: 'game_provider_code',
                cell: ({ row }) => <Typography>{row.original.game_provider_code}</Typography>
            },
            {
                header: 'Username',
                accessorKey: 'username',
                cell: ({ row }) => (
                    <Typography
                        className='cursor-pointer'
                        onClick={() => {
                            setSelectedUsername(row.original.username)
                            setIsUserDetailModalOpen(true)
                        }}
                    >
                        {row.original.username}
                    </Typography>
                )
            },

            // --- Group: Transfer ---
            {
                header: 'Transfer',
                columns: [
                    {
                        header: 'Total In Count',
                        accessorKey: 'total_in_count',
                        cell: ({ row }) => <Typography>{row.original.total_number_of_transfer_in}</Typography>
                    },
                    {
                        header: 'Total In Amount',
                        accessorKey: 'total_in_amount',
                        cell: ({ row }) => <Typography>{row.original.total_transfer_in_amount}</Typography>
                    },
                    {
                        header: 'Total Out Count',
                        accessorKey: 'total_out_count',
                        cell: ({ row }) => <Typography>{row.original.total_number_of_transfer_out}</Typography>
                    },
                    {
                        header: 'Total Out Amount',
                        accessorKey: 'total_out_amount',
                        cell: ({ row }) => <Typography>{row.original.total_transfer_out_amount}</Typography>
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
                        cell: ({ row }) => <Typography>{row.original.total_number_of_deposit}</Typography>
                    },
                    {
                        header: 'Total Deposit Amount',
                        accessorKey: 'total_deposit_amount',
                        cell: ({ row }) => <Typography>{row.original.total_deposit}</Typography>
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
                        cell: ({ row }) => <Typography>{row.original.total_number_of_withdrawal}</Typography>
                    },
                    {
                        header: 'Total Withdrawal Amount',
                        accessorKey: 'total_withdrawal_amount',
                        cell: ({ row }) => <Typography>{row.original.total_withdrawal}</Typography>
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
                        cell: ({ row }) => <Typography>{row.original.total_cashout_fee}</Typography>
                    },
                    {
                        header: 'Total Deposit Processing Fee',
                        accessorKey: 'total_deposit_processing_fee',
                        cell: ({ row }) => <Typography>{row.original.total_deposit_processing_fee}</Typography>
                    },
                    {
                        header: 'Total Withdrawal Processing Fee',
                        accessorKey: 'total_withdrawal_processing_fee',
                        cell: ({ row }) => <Typography>{row.original.total_withdrawal_processing_fee}</Typography>
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
                        cell: ({ row }) => <Typography>{row.original.total_bet_count}</Typography>
                    },
                    {
                        header: 'Total Bet Amount',
                        accessorKey: 'total_bet_amount',
                        cell: ({ row }) => <Typography>{row.original.total_bet_amount}</Typography>
                    },
                    {
                        header: 'Total Valid Bet Amount',
                        accessorKey: 'total_valid_bet_amount',
                        cell: ({ row }) => <Typography>{row.original.total_valid_bet_amount}</Typography>
                    },
                    {
                        header: 'Player W/L',
                        accessorKey: 'player_win_loss',
                        cell: ({ row }) => <Typography>{row.original.win_lose}</Typography>
                    },
                    {
                        header: 'Total Jackpot Contribution',
                        accessorKey: 'total_jackpot_contribution',
                        cell: ({ row }) => <Typography>{row.original.total_jackpot_contribution}</Typography>
                    },
                    {
                        header: 'Total Jackpot Win',
                        accessorKey: 'total_jackpot_win',
                        cell: ({ row }) => <Typography>{row.original.total_jackpot_win}</Typography>
                    },
                    {
                        header: 'Nett Jackpot',
                        accessorKey: 'nett_jackpot',
                        cell: ({ row }) => <Typography>{row.original.nett_jackpot}</Typography>
                    },
                    {
                        header: 'Game Bet Amount',
                        accessorKey: 'game_bet_amount',
                        cell: ({ row }) => <Typography>{row.original.game_bet_amount}</Typography>
                    },
                    {
                        header: 'Gross Game Revenue (GGR)',
                        accessorKey: 'gross_game_revenue',
                        cell: ({ row }) => <Typography>{row.original.gross_game_revenue}</Typography>
                    }
                ]
            }
        ],
        [tableData]
    )



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
                <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onSearch} />
                <Divider />
                <div className='overflow-x-auto'>
                    <table className={tableStyles.table}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}
                                            colSpan={header.colSpan}
                                            style={{
                                                textAlign: 'center', // 👈 center text horizontally
                                                verticalAlign: 'middle', // 👈 center vertically if taller
                                            }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <>
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
                                                </>
                                            )}
                                        </th>
                                    ))}
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
                                {table
                                    .getRowModel()
                                    .rows.map(row => {
                                        return (
                                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        )
                                    })}
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
            <UserDetailModal
                username={selectedUsername}
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
