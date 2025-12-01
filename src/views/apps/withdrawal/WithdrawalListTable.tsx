'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'

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
import { toast } from 'react-toastify'
import IconButton from '@mui/material/IconButton'

import DialogAddNewWithdrawal from './DialogAddNewWithdrawal'

// Type Imports
import type { WithdrawalType, CrossBettingTransaction } from '@/types/apps/withdrawalTypes'
import type { MemberType } from '@/types/apps/memberTypes'
import { Transaction } from '@/types/apps/withdrawalTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { formatDateTime } from '@/utils/dateFormatter'
import { useFetchData, usePostData } from '@/utils/api'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Third-party Style Imports
import 'react-toastify/dist/ReactToastify.css'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from "@mui/material/DialogActions";

import UserWithdrawalModal from './UserWithdrawalModal'
import UserDetailModal from '../member/list/UserDetailModal'
import UserGameResultModal from './UserGameResultModal'

import {
    Tabs, Tab, Box, Grid, Table, TableBody, TableRow, TableCell,
    Chip, TextField, TableHead
} from "@mui/material";

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

type WithdrawalTypeWithAction = WithdrawalType & {
    action?: string
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

// Column Definitions
const columnHelper = createColumnHelper<WithdrawalTypeWithAction>()

type PaginationData = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

// Define props type including onSearch
type WithdrawalListTableProps = {
    tableData?: WithdrawalType[]
    paginationData: PaginationData
    onPageChange: (page: number) => void
    onRowsPerPageChange: (perPage: number) => void
    filters: {
        status: string[]
        startDate: string
        endDate: string
    }
    onFilterChange: (newFilters: {
        status: string[]
        startDate: string
        endDate: string
    }) => void
    onSearch: () => void
    onManualSearch: () => void
}

const getAccountNumber = (accountInfo: string | undefined) => {
    if (!accountInfo) {
        return '';
    }

    const parts = accountInfo.split(' - ');

    return parts[parts.length - 1].trim();
}

const CrossBettingsDialog = ({ open, onClose, withdrawal }: { open: boolean, onClose: () => void, withdrawal: WithdrawalTypeWithAction | null }) => {
    const [crossBettingsData, setCrossBettingsData] = useState<CrossBettingTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchData = useFetchData();

    useEffect(() => {
        const fetchCrossBettings = async () => {
            if (!open || !withdrawal) {
                return;
            }

            setLoading(true);
            setError(null);
            setCrossBettingsData([]);

            try {
                const queryString = `/withdrawals/cross_betting?member_account_id=${withdrawal.member_id}&withdrawal_id=${withdrawal.id}`;
                const response = await fetchData(queryString);

                setCrossBettingsData(Array.isArray(response.data?.cross_bets) ? response.data.cross_bets : []);
            } catch (err) {
                console.error('Failed to fetch cross bettings:', err);
                setError('Failed to load cross bettings data.');
            } finally {
                setLoading(false);
            }
        };

        fetchCrossBettings();
    }, [open, withdrawal, fetchData]);

    if (!withdrawal) {
        return null;
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
            <DialogTitle>Cross Bettings for {withdrawal.username}</DialogTitle>
            <IconButton onClick={onClose} className="absolute block-start-4 inline-end-4">
                <i className="ri-close-line" />
            </IconButton>
            <Divider />
            <DialogContent>
                {loading && <Typography>Loading...</Typography>}
                {/* --- Cross Betting Transaction Section --- */}
                {!loading &&
                    <Box p={2} mt={3}>
                        <h4>Cross Betting Transaction Data</h4>
                        {/* Transaction Table */}
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Member Account ID</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Game Provider Code</TableCell>
                                    <TableCell>Game Round No</TableCell>
                                    <TableCell>Game Code</TableCell>
                                    <TableCell>game_name</TableCell>
                                    <TableCell>game_type</TableCell>
                                    <TableCell>bet_type</TableCell>
                                    <TableCell>bet_choice</TableCell>
                                    <TableCell>bet_amount</TableCell>
                                    <TableCell>ticket_time</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {crossBettingsData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center">
                                            No data available
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    crossBettingsData.map((t, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{t.member_account_id}</TableCell>
                                            <TableCell>{t.username}</TableCell>
                                            <TableCell>{t.game_provider_code}</TableCell>
                                            <TableCell>{t.game_round_no}</TableCell>
                                            <TableCell>{t.game_code}</TableCell>
                                            <TableCell>{t.game_name}</TableCell>
                                            <TableCell>{t.game_type}</TableCell>
                                            <TableCell>{t.bet_type}</TableCell>
                                            <TableCell>{t.bet_choice}</TableCell>
                                            <TableCell>{t.bet_amount}</TableCell>
                                            <TableCell>{t.ticket_time}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                }
                {error && <Typography color="error">{error}</Typography>}
                {/* {crossBettingsData && <pre>{JSON.stringify(crossBettingsData, null, 2)}</pre>} */}

            </DialogContent>
            <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
        </Dialog>
    );
};

const WithdrawalListTable = ({
    tableData,
    paginationData,
    onPageChange,
    onRowsPerPageChange,
    filters,
    onFilterChange,
    onSearch,
    onManualSearch
}: WithdrawalListTableProps) => {
    // States
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')

    const [isWithdrawDetailModalOpen, setIsWithdrawDetailModalOpen] = useState(false)
    const [isGameResultModalOpen, setIsGameResultModalOpen] = useState(false)

    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalTypeWithAction | null>(null)
    const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<number | null>(null)
    const [isCrossBettingsModalOpen, setIsCrossBettingsModalOpen] = useState(false);
    const [selectedWithdrawalForBettings, setSelectedWithdrawalForBettings] = useState<WithdrawalTypeWithAction | null>(null);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)
    const [selectedUsernameForDetail, setSelectedUsernameForDetail] = useState<string | null>(null)
    const [selectedUserIdForDetail, setSelectedUserIdForDetail] = useState<number | null>(null)
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<MemberType | null>(null)

    // Hooks
    const { lang: locale } = useParams()

    // Auto-refresh data every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            // This function is passed from the parent and should trigger a data refetch.
            onSearch()
        }, 30000) // 30000 milliseconds = 30 seconds.

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(interval)
    }, [onSearch]) // Dependency array ensures the effect is re-run if onSearch changes

    const columns = useMemo<ColumnDef<WithdrawalTypeWithAction, any>[]>(
        () => [
            columnHelper.accessor('action', {
                header: 'Action',
                cell: ({ row }) => (
                    <div className='flex items-center gap-0.5'>
                        <IconButton size='small' onClick={() => {
                            setSelectedWithdrawal(row.original)
                            setIsWithdrawDetailModalOpen(true)
                        }}>
                            <i className='ri-eye-line text-textSecondary' />
                        </IconButton>
                        <IconButton size='small' onClick={() => {
                            setSelectedWithdrawal(row.original)
                            setIsGameResultModalOpen(true)
                        }}>
                            <i className='ri-gamepad-line text-textSecondary' />
                        </IconButton>
                    </div>
                ),
                enableSorting: false,
                meta: {
                    pinned: 'left'
                }
            }),
            columnHelper.accessor('id', {
                header: 'ID',
                cell: ({ row }) => <Typography>{row.original.id}</Typography>
            }),
            columnHelper.accessor('member_id', {
                header: 'Member ID',
                cell: ({ row }) => (
                    <Typography
                        className='cursor-pointer'
                        sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => {
                            setSelectedUsernameForDetail(row.original.username)
                            setSelectedUserIdForDetail(row.original.member_id)
                            setSelectedWithdrawalId(row.original.id)
                            setSelectedUserForDetail(row.original as unknown as MemberType)
                            setIsUserDetailModalOpen(true)
                        }}
                    >{row.original.member_id}</Typography>
                )
            }),
            columnHelper.accessor('username', {
                header: 'Username',
                cell: ({ row }) => (
                    <Typography
                        className='cursor-pointer'
                        sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => {
                            setSelectedUsernameForDetail(row.original.username)
                            setSelectedUserIdForDetail(row.original.member_id)
                            setSelectedUserForDetail(row.original as unknown as MemberType)
                            setSelectedWithdrawalId(row.original.id)
                            setIsUserDetailModalOpen(true)
                        }}
                    >{row.original.username}</Typography>
                )
            }),
            columnHelper.accessor('risk_score', {
                header: 'Risk Score',
                cell: ({ row }) => <Typography color={row.original.risk_profile?.color}> {row.original.risk_profile?.risk_score} </Typography>
            }),
            columnHelper.accessor('grade', {
                header: 'Grade',
                cell: ({ row }) => <Typography>{row.original.grade}</Typography>
            }),
            columnHelper.accessor('cross_bettings_count', {
                header: 'Cross Bettings Count',
                cell: ({ row }) => (
                    <Typography
                        className='cursor-pointer'
                        onClick={() => {
                            setSelectedWithdrawalForBettings(row.original);
                            setIsCrossBettingsModalOpen(true);
                        }}
                        sx={{ color: 'primary.main', textDecoration: 'underline' }}
                    >
                        {row.original.cross_bettings_count}

                    </Typography>
                )
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ row }) => <Chip
                    label={row.original.status_name}
                    color={
                        row.original.status === 0 ? 'default' :
                            row.original.status === 1 ? 'success' :
                                row.original.status === 2 ? 'error' : 'warning'
                    }
                    variant='tonal'
                    size='small'
                />
            }),
            columnHelper.accessor('amount', {
                header: 'Amount',
                cell: ({ row }) => <Typography>{row.original.amount}</Typography>
            }),
            columnHelper.accessor('confirm_account', {
                header: 'Confirm Account',
                cell: ({ row }) => <Typography>{row.original.confirm_account}</Typography>
            }),
            columnHelper.accessor('member_bank', {
                header: 'Member Bank',
                cell: ({ row }) => <Typography>{row.original.member_bank}</Typography>
            }),
            columnHelper.accessor('member_bank_account', {
                header: 'Member Bank Account',
                cell: ({ row }) => <Typography>{getAccountNumber(row.original.member_bank_account)}</Typography>
            }),
            columnHelper.accessor('handler', {
                header: 'Handler',
                cell: ({ row }) => <Typography>{row.original.handler}</Typography>
            }),
            columnHelper.accessor('remarks', {
                header: 'Remark',
                cell: ({ row }) => <Typography>{row.original.remarks}</Typography>
            }),
            columnHelper.accessor('created_at', {
                header: 'Created Time',
                cell: ({ row }) => <Typography>{formatDateTime(row.original.created_at)}</Typography>
            }),
            columnHelper.accessor('updated_at', {
                header: 'Updated Time',
                cell: ({ row }) => <Typography>{formatDateTime(row.original.updated_at)}</Typography>
            }),
            columnHelper.accessor('processing_time', {
                header: 'Processing Time',
                cell: ({ row }) => <Typography>{formatDateTime(row.original.processing_time)}</Typography>
            }),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tableData]
    )

    const table = useReactTable({
        data: tableData as WithdrawalType[],
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
                <CardHeader title='Withdrawal List' className='pbe-4' />
                {/* Pass onManualSearch prop to TableFilters */}
                <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onManualSearch} />
                <Divider />
                <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
                </div>
                <div className='overflow-x-auto'>
                    <table className={tableStyles.table}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}>
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
                    rowsPerPageOptions={[10, 30, 50]}
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
            <UserWithdrawalModal
                withdrawal={selectedWithdrawal}
                open={isWithdrawDetailModalOpen}
                onClose={() => {
                    setIsWithdrawDetailModalOpen(false)
                    setSelectedWithdrawal(null)
                }}
                onReloadTable={() => {
                    onSearch()
                }}
            />

            <UserGameResultModal
                withdrawal={selectedWithdrawal}
                open={isGameResultModalOpen}
                onClose={() => {
                    setIsGameResultModalOpen(false)
                    setSelectedWithdrawal(null)
                }}
                onReloadTable={() => {
                    onSearch()
                }}
            />
            <CrossBettingsDialog
                open={isCrossBettingsModalOpen}
                onClose={() => {
                    setIsCrossBettingsModalOpen(false);
                    setSelectedWithdrawalForBettings(null);
                }}
                withdrawal={selectedWithdrawalForBettings}
            />
            <UserDetailModal
                defaultTab={3}
                username={selectedUsernameForDetail}
                userId={selectedUserIdForDetail}
                withdrawId={selectedWithdrawalId}
                user={selectedUserForDetail}
                open={isUserDetailModalOpen}
                onClose={() => {
                    setIsUserDetailModalOpen(false)
                    setSelectedUsernameForDetail(null)
                    setSelectedUserForDetail(null)
                }}
            />
            {/* <AddUserDrawer
                open={addUserOpen}
                handleClose={() => setAddUserOpen(!addUserOpen)}
                userData={data}
                setData={setData}
            /> */}
        </>
    )
}

export default WithdrawalListTable
