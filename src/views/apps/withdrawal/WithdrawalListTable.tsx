'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'


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
import IconButton from '@mui/material/IconButton'
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
import DialogAddNewWithdrawal from './DialogAddNewWithdrawal'
import { useForm, Controller } from 'react-hook-form'
import FormHelperText from '@mui/material/FormHelperText'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { WithdrawalType, BankTransaction } from '@/types/apps/withdrawalTypes'
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

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from "@mui/material/DialogActions";


import {
    Tabs, Tab, Box, Grid, Table, TableBody, TableRow, TableCell,
    Chip, TextField, TableHead, Select, MenuItem, FormControl
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
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalTypeWithAction | null>(null)

    // Hooks
    const { lang: locale } = useParams()

    // Auto-refresh data every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            // This function is passed from the parent and should trigger a data refetch.
            onSearch()
        }, 60000) // 60000 milliseconds = 1 minute. I've set it back to 1 minute.

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
                cell: ({ row }) => <Typography>{row.original.member_id}</Typography>
            }),
            columnHelper.accessor('username', {
                header: 'Username',
                cell: ({ row }) => <Typography>{row.original.username}</Typography>
            }),
            columnHelper.accessor('risk_score', {
                header: 'Risk Score',
                cell: ({ row }) => <Typography color={row.original.risk_profile?.color}> {row.original.risk_profile?.risk_score} </Typography>
            }),
            columnHelper.accessor('grade', {
                header: 'Grade',
                cell: ({ row }) => <Typography>{row.original.grade}</Typography>
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
                    {/* <Button
                        color='secondary'
                        variant='outlined'
                        startIcon={<i className='ri-upload-2-line' />}
                        className='max-sm:is-full'
                    >
                        Export
                    </Button> */}
                    <div className='flex items-center gap-x-4 max-sm:gap-y-4 flex-col max-sm:is-full sm:flex-row'>
                        <DialogAddNewWithdrawal />
                    </div>
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
            <UserWithdrawalModal
                withdrawal={selectedWithdrawal}
                open={isWithdrawDetailModalOpen}
                onClose={() => {
                    setIsWithdrawDetailModalOpen(false)
                    setSelectedWithdrawal(null)
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


// --- User Withdrawal Modal Component ---
const UserWithdrawalModal = ({
    withdrawal,
    open,
    onClose
}: { withdrawal: WithdrawalTypeWithAction | null; open: boolean; onClose: () => void }) => {
    // const [userData, setUserData] = useState<MemberType | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [bankList, setBankList] = useState<{ id: number; name: string }[]>([])

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        // Initialize with empty or null values
        defaultValues: {
            withdraw_id: null,
            amount: null,
            member_account_id: null,
            bank_account_id: null,
            merchant_bank_id: null,
            remark: ''
        }
    });
    const [transactionRow, setTransactionRow] = useState<any>(null);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);

    const postData = usePostData()
    const fetchData = useFetchData()

    // Fetch bank list when the modal opens
    const loadBankList = async () => {
        try {
            const response = await fetchData('/system/withdrawal_banks') // Assuming '/banks' is your API endpoint

            if (response && response.data) {
                console.log("response", response)
                setBankList(response.data?.banks)
            } else {
                setBankList([])
            }
        } catch (err) {
            console.error('Error fetching bank list:', err)
            setError('Failed to load bank list.')
        }
    }


    const handleAddTransaction = () => {
        setTransactionRow({}); // Use an empty object to indicate the form is open
        reset({
            withdraw_id: null,
            amount: null,
            member_account_id: null,
            bank_account_id: null,
            merchant_bank_id: null,
            remark: ''
            // bank_id: null,
            // amount: '',
            // remark: '',
            // fee_total: 0,
            // feeCompany: '', 
            // feePlayer: '', 
            // receipt: null
        });
    };

    const onApproveSubmit = async (data: any) => {
        const selectedBank = bankList.find(bank => bank.id === data.bank_id);
        const newTransaction = {
            ...data,
            merchant_bank_account: selectedBank ? selectedBank.name : ''
            // console.log("Approving with body:", body);
        };
        const body = {
            withdraw_id: withdrawal?.id,
            amount: parseFloat(newTransaction.amount),
            member_account_id: withdrawal?.member_id,
            bank_account_id: getAccountNumber(withdrawal?.member_bank_account),
            merchant_bank_id: selectedBank?.id, // Placeholder, adjust as needed
            remarks: newTransaction.remark || "Approved by user" // Use remark from state
        };

        try {
            await postData(`/withdrawals/approve`, body);
            setConfirmOpen(false);
            onClose(); // close main modal
            setTransactions(prev => [newTransaction, ...prev]);
            setTransactionRow(null);
            reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }

    };

    const handleRemove = () => {
        setTransactionRow(null);
        reset();
    };

    useEffect(() => {
        if (!open) {
            setError(null)
            setLoading(false)
            // setUserData(null) // clear local state, but keep cache
        }

        if (open && withdrawal?.bank_transactions) {
            // Initialize transactions with data from the withdrawal prop
            setTransactions(withdrawal.bank_transactions);
        }

        if (open) {
            // Fetch the list of banks when the modal is opened
            loadBankList()
            setTransactionRow(null); // Ensure form is hidden on open
        }
    }, [open])


    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rejectionRemark, setRejectionRemark] = useState('');
    const handleReject = async () => {
        if (!withdrawal) {
            setError('Withdrawal data is not available.');
            return;
        }

        try {
            const body = {
                withdraw_id: withdrawal.id,
                amount: withdrawal.amount,
                member_account_id: withdrawal.member_id,
                // Assuming bank_account_id and merchant_bank_id are available on withdrawal
                // If not, you might need to adjust where these values come from.
                // For now, I'll use placeholder values or existing ones.
                bank_account_id: withdrawal.member_id, // Placeholder, adjust as needed
                merchant_bank_id: 0, // Placeholder, adjust as needed
                remarks: rejectionRemark || "Rejected by user" // Use remark from state
            };

            await postData(`/withdrawals/${withdrawal.id}/reject`, body);

            setConfirmOpen(false);
            onClose(); // close main modal
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
                <DialogTitle>Withdrawal Details</DialogTitle>
                {withdrawal && (
                    <>
                        <DialogContent>
                            {/* Tabs */}
                            <Tabs value={0}>
                                <Tab label="Withdrawal Info" />
                            </Tabs>

                            {/* Member & Bank Info */}
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Box border={1} borderRadius={2} p={2}>
                                        <h4>Member Info</h4>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Username</TableCell>
                                                    <TableCell>{withdrawal.username}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Member Group</TableCell>
                                                    <TableCell>{withdrawal.member_group}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Merchant</TableCell>
                                                    <TableCell>{withdrawal.merchant_name}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Remarks</TableCell>
                                                    <TableCell>{withdrawal.remarks}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Box border={1} borderRadius={2} p={2}>
                                        <h4>Bank Info</h4>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Bank Name</TableCell>
                                                    <TableCell>{withdrawal.member_bank}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Account Name</TableCell>
                                                    <TableCell>{withdrawal.name}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Account Number</TableCell>
                                                    <TableCell>{getAccountNumber(withdrawal.member_bank_account)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Remarks</TableCell>
                                                    <TableCell>-</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Transaction Info */}
                            <Box border={1} borderRadius={2} p={2} mt={3}>
                                <h4>Transaction Info</h4>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>W{withdrawal.id}</TableCell>
                                            <TableCell>Created At</TableCell>
                                            <TableCell>{formatDateTime(withdrawal.created_at)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={withdrawal.status_name}
                                                    color={
                                                        withdrawal.status === 0 ? 'default' :
                                                            withdrawal.status === 1 ? 'success' :
                                                                withdrawal.status === 2 ? 'error' : 'warning'
                                                    }
                                                    variant='tonal'
                                                />
                                            </TableCell>
                                            <TableCell>Confirmed Amount</TableCell>
                                            <TableCell>{withdrawal.confirmed_amount}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Processing Date</TableCell>
                                            <TableCell>{formatDateTime(withdrawal.processing_time)}</TableCell>
                                            <TableCell>Handler</TableCell>
                                            <TableCell>{withdrawal.approved_by}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                <Box mt={2}>
                                    <TextField
                                        label="Remark"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{ mt: 2 }}
                                    >
                                        Update
                                    </Button>
                                </Box>
                            </Box>

                            {/* --- Bank Transaction Section --- */}
                            <Box border={1} borderRadius={2} p={2} mt={3}>
                                <h4>Bank Transaction</h4>

                                {withdrawal.status === 0 && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disabled={!!transactionRow} // disable when editing
                                        onClick={handleAddTransaction}
                                        sx={{ mb: 2 }}
                                    >
                                        Add Transaction
                                    </Button>
                                )}

                                {/* Input Row (only if Add Transaction clicked) */}
                                {transactionRow && (
                                    <form onSubmit={handleSubmit(onApproveSubmit)}>
                                        <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
                                            {/* Merchant Bank */}
                                            <FormControl fullWidth error={!!errors.merchant_bank_id}
                                                sx={{ width: "250px" }}   // 👈 fixed width here
                                            >
                                                <Controller
                                                    name="merchant_bank_id"
                                                    control={control}
                                                    rules={{ required: true }}
                                                    render={({ field }) => (
                                                        <Select
                                                            {...field}
                                                            displayEmpty
                                                            sx={{ minWidth: 50 }}
                                                            value={field.value || ''}
                                                        >
                                                            <MenuItem value="">Please Select</MenuItem>
                                                            {bankList.map((bank) => (
                                                                <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    )}
                                                />
                                                {errors.merchant_bank_id && <FormHelperText error>Please select a bank.</FormHelperText>}
                                            </FormControl>

                                            {/* Amount */}
                                            <Controller
                                                name="amount"
                                                control={control}
                                                rules={{ required: true, min: 0.01 }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Amount"
                                                        {...(errors.amount
                                                            ? {
                                                                error: true,
                                                                helperText: errors.amount.type === 'min' ? 'Amount must be greater than 0.' : 'This field is required.'
                                                            }
                                                            : {})}
                                                    />
                                                )}
                                            />

                                            <Controller
                                                name="remark"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Remark"
                                                    />
                                                )}
                                            />

                                            {/* Processing Fees */}
                                            {/* <Controller
                                                name="fee_total"
                                                control={control}
                                                rules={{ min: 0 }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Fee Total"
                                                        {...(errors.fee_total && { error: true, helperText: 'Fee Total cannot be negative.' })}
                                                    />
                                                )}
                                            /> */}
                                            {/* <Controller
                                                name="feeCompany"
                                                control={control}
                                                rules={{ required: true, min: 0.01 }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Fee Company"
                                                        {...(errors.feeCompany
                                                            ? {
                                                                error: true,
                                                                helperText:
                                                                    errors.feeCompany.type === 'min'
                                                                        ? 'Fee Company must be greater than 0.'
                                                                        : 'This field is required.'
                                                            }
                                                            : {})}
                                                    />
                                                )}
                                            /> */}
                                            {/* <Controller
                                                name="feePlayer"
                                                control={control}
                                                rules={{ required: true, min: 0.01 }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Fee Player"
                                                        type="number"
                                                        {...(errors.feePlayer
                                                            ? {
                                                                error: true,
                                                                helperText:
                                                                    errors.feePlayer.type === 'min'
                                                                        ? 'Fee Player must be greater than 0.'
                                                                        : 'This field is required.'
                                                            }
                                                            : {})}
                                                    />
                                                )}
                                            /> */}

                                            {/* Receipt */}
                                            {/* <Button variant="outlined" component="label">
                                                Upload Receipt
                                                <Controller
                                                    name="receipt"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            type="file"
                                                            hidden
                                                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                                        />
                                                    )}
                                                />
                                            </Button> */}

                                            {/* Actions */}
                                            <Button variant="contained" color="success" type="submit">
                                                Approve
                                            </Button>
                                            <Button variant="contained" color="warning" onClick={handleRemove}>
                                                Remove
                                            </Button>
                                        </Box>
                                    </form>
                                )}

                                {/* Transaction Table */}
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Bank</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Processing Fee</TableCell>
                                            <TableCell>Confirmed Amount</TableCell>
                                            <TableCell>Receipt</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>References</TableCell>
                                            <TableCell>Remarks</TableCell>
                                            <TableCell>Created By</TableCell>
                                            <TableCell>Updated By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={11} align="center">
                                                    No data available
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((t, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>{t.merchant_bank_account}</TableCell>
                                                    <TableCell>{withdrawal.amount}</TableCell>
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column">
                                                            <Box display="flex" justifyContent="space-between">
                                                                <strong>Player:</strong>
                                                                <span>{withdrawal.member_processing_fee}</span>
                                                            </Box>
                                                            <Box display="flex" justifyContent="space-between">
                                                                <span>Company:</span>
                                                                <span>{withdrawal.processing_fee}</span>
                                                            </Box>
                                                            <Box display="flex" justifyContent="space-between">
                                                                <span>Total:</span>
                                                                <span>
                                                                    {(
                                                                        parseFloat(withdrawal.processing_fee || "0") +
                                                                        parseFloat(withdrawal.member_processing_fee || "0")
                                                                    ).toFixed(2)}
                                                                </span>
                                                            </Box>
                                                        </Box>

                                                    </TableCell>
                                                    <TableCell>{withdrawal.confirmed_amount}</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>{withdrawal.status_name}</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>-</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>

                            <Box border={1} borderRadius={2} p={2} mt={3}>
                                <h4>Past Transactions</h4>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Refer ID</TableCell>
                                            <TableCell>Transaction Type</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>References</TableCell>
                                            <TableCell>Remarks</TableCell>
                                            <TableCell>Created By</TableCell>
                                            <TableCell>Updated By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Example rows */}
                                        {/* <TableRow>
                                    <TableCell>345659</TableCell>
                                    <TableCell>Withdrawal</TableCell>
                                    <TableCell sx={{ color: "red" }}>-600.00</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>kumar775<br />2025-09-19 09:25</TableCell>
                                    <TableCell>rlee6988<br />2025-09-19 09:25</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>1539435</TableCell>
                                    <TableCell>Deposit</TableCell>
                                    <TableCell sx={{ color: "green" }}>300.00</TableCell>
                                    <TableCell>DepSL-ap6-9-141531-20250918151011</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>kumar775<br />2025-09-18 23:10</TableCell>
                                    <TableCell>-<br />2025-09-18 23:11</TableCell>
                                </TableRow> */}
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No data available
                                            </TableCell>

                                        </TableRow>

                                        {/* If no data */}
                                        {/* 
        <TableRow>
          <TableCell colSpan={7} align="center">
            No past transactions
          </TableCell>
        </TableRow>
        */}
                                    </TableBody>
                                </Table>
                            </Box>
                        </DialogContent>

                        {/* Fixed bottom actions */}
                        {withdrawal.status !== 1 && (
                            <DialogActions sx={{ justifyContent: "flex-start", p: 2 }}>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => setConfirmOpen(true)}
                                >
                                    Reject
                                </Button>

                            </DialogActions>
                        )}
                    </>
                )}
            </Dialog>

            {/* 🔴 Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm Rejection</DialogTitle>
                <DialogContent>
                    Are you sure you want to reject this withdrawal?
                    <TextField
                        autoFocus
                        margin="dense"
                        id="rejection-remark"
                        label="Rejection Remark"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={rejectionRemark}
                        onChange={(e) => setRejectionRemark(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleReject}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}


export default WithdrawalListTable
