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
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import CircularProgress from '@mui/material/CircularProgress'

import Collapse from '@mui/material/Collapse'

import {
    Tabs, Tab, Box, Grid, Table, TableBody, TableRow, TableCell,
    Chip, TextField, TableHead, Select, MenuItem, FormControl
} from "@mui/material";

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
import type { MemberType } from '@/types/apps/memberTypes'
import type { WalletInfo, WalletLog, PromotionLog } from '@/types/apps/walletTypes'
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

type MembersTypeWithAction = MemberType & {
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
    user,
    open,
    onClose
}: { username: string | null; user: MemberType | null; open: boolean; onClose: () => void }) => {
    const [userData, setUserData] = useState<MemberType | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fetchData = useFetchData()

    const [walletData, setWalletData] = useState<WalletInfo | null>(null)
    const [walletLoading, setWalletLoading] = useState(false)
    const [walletError, setWalletError] = useState<string | null>(null)

    const [walletLogs, setWalletLogs] = useState<WalletLog[] | null>(null)
    const [walletLogsLoading, setWalletLogsLoading] = useState(false)
    const [walletLogsError, setWalletLogsError] = useState<string | null>(null)

    const [promotionLogs, setPromotionLogs] = useState<PromotionLog[] | null>(null)
    const [promotionLogsLoading, setPromotionLogsLoading] = useState(false)
    const [promotionLogsError, setPromotionLogsError] = useState<string | null>(null)

    const [tabValue, setTabValue] = useState(0)

    const [openBasicInfo, setOpenBasicInfo] = useState(true)
    const [openAccountInfo, setOpenAccountInfo] = useState(true)




    // 🗂 Cache user data by username
    const cacheRef = useRef<Record<string, MemberType>>({})

    // Fetch user details (and update cache)
    const loadUserData = async (uname: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchData(`/members/u/${uname}`)
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

    // Fetch wallet info when tab is clicked
    useEffect(() => {
        const loadWalletData = async () => {
            if (tabValue === 1 && username && !walletData) {
                setWalletLoading(true)
                setWalletError(null)
                try {
                    const response = await fetchData(`/members/game_wallets?username=${username}&user_id=${userData?.id}`)
                    console.log("response")
                    console.log(response.data)
                    setWalletData(response?.data)
                } catch (err) {
                    setWalletError('Failed to load wallet data.')
                } finally {
                    setWalletLoading(false)
                }
            }
        }

        loadWalletData()
    }, [tabValue, username, walletData, fetchData])

    // Fetch wallet logs when tab is clicked
    useEffect(() => {
        const loadWalletLogs = async () => {
            if (tabValue === 2 && username && !walletLogs) {
                setWalletLogsLoading(true)
                setWalletLogsError(null)
                try {
                    const response = await fetchData(`/members/wallet_logs?user_id=${userData?.id}`)
                    setWalletLogs(response?.data?.logs || [])
                } catch (err) {
                    setWalletLogsError('Failed to load wallet logs.')
                } finally {
                    setWalletLogsLoading(false)
                }
            }
        }

        loadWalletLogs()
    }, [tabValue, username, walletLogs, fetchData])

    // Fetch promotion logs when tab is clicked
    useEffect(() => {
        const loadPromotionLogs = async () => {
            if (tabValue === 3 && userData?.id && !promotionLogs) {
                setPromotionLogsLoading(true)
                setPromotionLogsError(null)
                try {
                    const response = await fetchData(`/members/promotion_logs?user_id=${userData.id}&page=1`)
                    setPromotionLogs(response?.data?.logs || [])
                } catch (err) {
                    setPromotionLogsError('Failed to load promotion logs.')
                } finally {
                    setPromotionLogsLoading(false)
                }
            }
        }

        loadPromotionLogs()
    }, [tabValue, userData, promotionLogs, fetchData])

    // Don’t clear cache on close → only reset modal state
    useEffect(() => {
        // Reset tab and data on close
        if (!open) {
            setTabValue(0)
            setWalletData(null)
            setWalletLogs(null)
            setPromotionLogs(null)
        }
        if (!open) {
            setError(null)
            setLoading(false)
            setUserData(null) // clear local state, but keep cache
        }
    }, [open])

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            sx={{ '& .MuiDialog-paper': { minHeight: '80vh' } }}>
            <DialogTitle className='flex justify-between items-center'>
                Info {user?.username} ({user?.id})
                <IconButton
                    onClick={onClose}
                    className='absolute block-start-4 inline-end-4'
                >
                    <i className='ri-close-line' />
                </IconButton>
            </DialogTitle>

            <>
                {/* Tabs */}
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab label="Basic Info" />
                    <Tab label="Wallet Info" />
                    <Tab label="Wallet Logs" />
                    <Tab label="Promotion History" />
                </Tabs>
                <DialogContent sx={{ pb: 20 }}>
                    {tabValue === 0 && (
                        <>
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                                    <CircularProgress size={24} /> <Typography>Loading basic info...</Typography>
                                </Box>
                            )}
                            {error && <Typography color="error">{error}</Typography>}

                            {userData && !loading && (
                                <>
                                    <Card sx={{ mt: 2 }}>
                                        <CardHeader
                                            title="Member Basic Info"
                                            action={
                                                <IconButton onClick={() => setOpenBasicInfo(prev => !prev)}>
                                                    <i
                                                        className={`ri-arrow-down-s-line`}
                                                        style={{
                                                            transform: openBasicInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: '0.3s',
                                                            fontSize: '1.2rem'
                                                        }}
                                                    />
                                                </IconButton>
                                            }
                                        />
                                        <Collapse in={openBasicInfo} timeout="auto" unmountOnExit>
                                            <Divider />
                                            <Box p={2}>
                                                <Grid container spacing={2}>
                                                    {[
                                                        { label: 'Merchant', value: userData.merchant_name ?? '-' },
                                                        { label: 'Currency', value: userData.currency ?? '-' },
                                                        { label: 'KYC Status', value: userData.kyc_progression ?? '-' },
                                                        { label: 'Status', value: userData.status ?? '-' },
                                                        { label: 'Name', value: userData.name ?? '-' },
                                                        { label: 'Date of Birth', value: userData.date_of_birth ?? '-' },
                                                        { label: 'Mobile', value: userData.mobile ?? '-' },
                                                        { label: 'Email', value: userData.email ?? '-' },
                                                        { label: 'Member Group', value: userData.member_group ?? '-' },
                                                        { label: 'VIP Progress', value: `${userData.vip_progress ?? 0}%` },
                                                        { label: 'Register IP', value: userData.registration_ip ?? '-' },
                                                        { label: 'Register Date', value: formatDateTime(userData.registration_created_at) ?? '-' },
                                                        { label: 'Register Domain', value: userData.registration_site ?? '-' },
                                                        { label: 'Register Locales', value: userData.registration_locale_code ?? '-' },
                                                        { label: 'Last Login IP', value: userData.last_ip_address ?? '-' },
                                                        { label: 'Last Login Date', value: formatDateTime(userData.last_login_date) ?? '-' },
                                                        { label: 'Last Login Domain', value: userData.last_domain ?? '-' },
                                                        { label: 'Last Login Locales', value: userData.last_login_locales ?? '-' },
                                                        { label: 'Labels', value: userData.labels ?? '-' },
                                                        { label: 'Remarks', value: userData.remarks ?? '-' }
                                                    ].map((item, index) => (
                                                        <Grid item xs={12} sm={6} md={3} key={index}>
                                                            <Box
                                                                sx={{
                                                                    border: '0px solid #e0e0e0',
                                                                    borderRadius: 0,

                                                                    p: 1.5,
                                                                    height: '100%'
                                                                }}
                                                            >
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {item.label}
                                                                </Typography>
                                                                <Typography variant="subtitle2">{item.value}</Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        </Collapse>
                                    </Card>

                                    {/* ===== Expandable Account & Wallet Info Section ===== */}
                                    <Card sx={{ mt: 2 }}>
                                        <CardHeader
                                            title="Wallet Info"
                                            action={
                                                <IconButton onClick={() => setOpenAccountInfo((prev) => !prev)}>
                                                    <i
                                                        className="ri-arrow-down-s-line"
                                                        style={{
                                                            transform: openAccountInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: '0.3s',
                                                            fontSize: '1.2rem'
                                                        }}
                                                    />
                                                </IconButton>
                                            }
                                        />
                                        <Collapse in={openAccountInfo} timeout="auto" unmountOnExit>
                                            <Divider />
                                            <Box p={2}>

                                                {/* Wallet Info Table */}
                                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>

                                                </Typography>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell><strong>Main Wallet</strong></TableCell>
                                                            <TableCell>{walletData?.main_wallet ?? '-'}</TableCell>
                                                            <TableCell><strong>Game Wallets Count</strong></TableCell>
                                                            <TableCell>{walletData?.wallets?.length ?? 0}</TableCell>
                                                        </TableRow>
                                                        {(walletData?.wallets || []).slice(0, 3).map((wallet, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell>{wallet.game_provider_code}</TableCell>
                                                                <TableCell colSpan={3}>
                                                                    {wallet.balance} {wallet.currency_code}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        </Collapse>
                                    </Card>

                                    {/* ===== Expandable Account & Wallet Info Section ===== */}
                                    <Card sx={{ mt: 2 }}>
                                        <CardHeader
                                            title="Account & Wallet Info"
                                            action={
                                                <IconButton onClick={() => setOpenAccountInfo((prev) => !prev)}>
                                                    <i
                                                        className="ri-arrow-down-s-line"
                                                        style={{
                                                            transform: openAccountInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: '0.3s',
                                                            fontSize: '1.2rem'
                                                        }}
                                                    />
                                                </IconButton>
                                            }
                                        />
                                        <Collapse in={openAccountInfo} timeout="auto" unmountOnExit>
                                            <Divider />
                                            <Box p={2}>
                                                {/* Account Info Table */}
                                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                                    Account Info
                                                </Typography>
                                                <Table size="small" sx={{ mb: 4 }}>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell><strong>Campaign</strong></TableCell>
                                                            <TableCell colSpan={5}>{userData.campaign_name ?? '-'}</TableCell>
                                                        </TableRow>

                                                        <TableRow>
                                                            <TableCell><strong>Affiliate</strong></TableCell>
                                                            <TableCell>{userData.affiliate_username ?? '-'}</TableCell>
                                                            <TableCell><strong>Telemarketer</strong></TableCell>
                                                            <TableCell>{userData.referrer ?? '-'}</TableCell>
                                                            <TableCell><strong>Agent</strong></TableCell>
                                                            <TableCell>{userData.agents_name ?? '-'}</TableCell>

                                                        </TableRow>


                                                        <TableRow>
                                                            <TableCell><strong>Referrer</strong></TableCell>
                                                            <TableCell>{userData.referrer ?? '-'}</TableCell>
                                                            <TableCell><strong>Referral Code</strong></TableCell>
                                                            <TableCell>{userData.referrer ?? '-'}</TableCell>
                                                            <TableCell><strong>Referral Count</strong></TableCell>
                                                            <TableCell>{userData.referrer ?? '-'}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        </Collapse>
                                    </Card>
                                </>
                            )}
                        </>
                    )}


                    {tabValue === 1 && (
                        <>
                            {walletLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                                    <CircularProgress size={24} /> <Typography>Loading wallet info...</Typography>
                                </Box>
                            )}

                            {walletError && <Typography color="error">{walletError}</Typography>}
                            {walletData && (
                                <>
                                    <Box border={0} borderRadius={0} p={2}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="subtitle1">
                                                <strong>Main Wallet:</strong> {walletData?.main_wallet ?? '0.00'}
                                            </Typography>

                                            {/* <Box display="flex" gap={1}>
                                                    <Button variant="contained" color="primary" size="small">
                                                        Create Account
                                                    </Button>
                                                    <Button variant="contained" color="success" size="small">
                                                        Sync All
                                                    </Button>
                                                </Box> */}
                                        </Box>

                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Game Provider</strong></TableCell>
                                                    <TableCell><strong>Username</strong></TableCell>
                                                    <TableCell><strong>Password</strong></TableCell>
                                                    <TableCell><strong>Currency</strong></TableCell>
                                                    <TableCell><strong>Balance</strong></TableCell>
                                                    {/* <TableCell><strong>Actions</strong></TableCell> */}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(walletData?.wallets || []).map((wallet, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{wallet.game_provider_code}</TableCell>
                                                        <TableCell>{wallet.ga_username}</TableCell>
                                                        <TableCell>{wallet.ga_password}</TableCell>
                                                        <TableCell>{wallet.currency_code}</TableCell>
                                                        <TableCell>{wallet.balance}</TableCell>
                                                        {/* <TableCell>
                                                                <Box display="flex" gap={1} alignItems="center">
                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        size="small"
                                                                    >
                                                                        Sync Balance
                                                                    </Button>
                                                                    <Select
                                                                        size="small"
                                                                        defaultValue=""
                                                                        displayEmpty
                                                                        sx={{ minWidth: 40 }}
                                                                    >
                                                                        <MenuItem value="">▼</MenuItem>
                                                                        <MenuItem value="reset">Reset Password</MenuItem>
                                                                        <MenuItem value="details">View Details</MenuItem>
                                                                    </Select>
                                                                </Box>
                                                            </TableCell> */}
                                                    </TableRow>
                                                ))}

                                                {/* Fallback if no wallets */}
                                                {(!walletData?.wallets || walletData.wallets.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center">
                                                            No wallet data available
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </>
                            )}
                        </>
                    )}

                    {tabValue === 2 && (
                        <>
                            {/* ===== Wallet Logs ===== */}
                            {walletLogsLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                                    <CircularProgress size={24} /> <Typography>Loading wallet logs...</Typography>
                                </Box>
                            )}
                            {walletLogsError && <Typography color="error">{walletLogsError}</Typography>}
                            {walletLogs && (
                                <Table size="small" sx={{ mt: 2 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Transaction Type</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Balance</TableCell>
                                            <TableCell>Details</TableCell>
                                            <TableCell>Operator</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {walletLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{formatDateTime(log.created_at)}</TableCell>
                                                <TableCell>{log.transaction_type}</TableCell>
                                                <TableCell>{log.amount}</TableCell>
                                                <TableCell>{log.balance}</TableCell>
                                                <TableCell>{log.details ?? '-'}</TableCell>
                                                <TableCell>{log.operator}</TableCell>
                                                <TableCell>{log.status_name}</TableCell>
                                            </TableRow>
                                        ))}


                                        {/* Fallback if no wallet logs */}
                                        {(!walletLogs || walletLogs.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    No wallet logs available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </>
                    )}
                    {tabValue === 3 && (
                        <>
                            {/* ===== Promotion History ===== */}
                            {promotionLogsLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                                    <CircularProgress size={24} /> <Typography>Loading promotion history...</Typography>
                                </Box>
                            )}
                            {promotionLogsError && <Typography color="error">{promotionLogsError}</Typography>}
                            {promotionLogs && (
                                <Table size="small" sx={{ mt: 2 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Promotion</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Bonus</TableCell>
                                            <TableCell>Turnover</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {promotionLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{formatDateTime(log.created_at)}</TableCell>
                                                <TableCell dangerouslySetInnerHTML={{ __html: log.promo_code }} />
                                                <TableCell>{log.amount}</TableCell>
                                                <TableCell>{log.bonus_amount}</TableCell>
                                                <TableCell>{log.accumulated_target_amount} / {log.target_amount}</TableCell>
                                                <TableCell>{log.status_name}</TableCell>
                                            </TableRow>
                                        ))}


                                        {/* Fallback if no wallet logs */}
                                        {(!promotionLogs || promotionLogs.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    No promotion logs available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </>
                    )}
                </DialogContent>
            </>

        </Dialog>
    )
}


const MemberListTable = ({
    tableData,
    paginationData,
    onPageChange,
    onRowsPerPageChange,
    filters,
    onFilterChange,
    onClear,
    onSearch // Receive onSearch prop
}: {
    tableData?: MemberType[]
    paginationData: PaginationData
    onPageChange: (page: number) => void
    onRowsPerPageChange: (perPage: number) => void
    filters: {
        username: string
        name: string
        mobile: string
        dateType: string
        startDate: string
        endDate: string
    }
    onFilterChange: (newFilters: {
        username: string
        name: string
        mobile: string
        dateType: string
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
    const [selectedUser, setSelectedUser] = useState<MemberType | null>(null)

    // Hooks
    const { lang: locale } = useParams()

    const columns = useMemo<ColumnDef<MembersTypeWithAction, any>[]>(
        () => {
            const registrationDomainColumn = columnHelper.accessor('registration_site', {
                header: 'Registration Domain',
                cell: ({ row }) => <Typography sx={{ textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.original.registration_site}</Typography>,
                size: 350,
            });

            const registrationIpColumn = columnHelper.accessor('registration_ip', {
                header: 'Registration IP Address',
                cell: ({ row }) => <Typography sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.original.registration_ip}</Typography>,
                size: 300,
                meta: {
                    pinned: 'right'
                }
            });

            const otherColumns = [
                columnHelper.accessor('action', {
                    header: 'Action',
                    cell: ({ row }) => (
                        <div className='flex items-center gap-0.5'>
                            <IconButton size='small' onClick={() => {
                                setSelectedUsername(row.original.username)
                                setSelectedUser(row.original)
                                setIsUserDetailModalOpen(true)
                            }}>
                                <i className='ri-eye-line text-textSecondary' />
                            </IconButton>
                        </div>
                    ),
                    enableSorting: false,
                    size: 80,
                    meta: {
                        pinned: 'left'
                    }
                }),
                columnHelper.accessor('id', {
                    header: 'Member ID',
                    cell: ({ row }) => <Typography>{row.original.id}</Typography>,
                    size: 100
                }),
                columnHelper.accessor('username', {
                    header: 'User Name',
                    cell: ({ row }) => (
                        <Typography
                            className='cursor-pointer'
                            sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' }, textAlign: 'center' }}
                            onClick={() => {
                                setSelectedUsername(row.original.username)
                                setSelectedUser(row.original)
                                setIsUserDetailModalOpen(true)
                            }}
                        >
                            {row.original.username}
                        </Typography>
                    ),
                    size: 150
                }),
                columnHelper.accessor('score', {
                    header: 'Score',
                    cell: ({ row }) => <Typography> - </Typography>,
                    size: 80
                }),
                columnHelper.accessor('grade', {
                    size: 80
                }),
                columnHelper.accessor('mobile', {
                    header: 'Mobile No',
                    cell: ({ row }) => <Typography>{row.original.mobile}</Typography>,
                    size: 150
                }),
                columnHelper.accessor('member_group_id', {
                    header: 'Member Group',
                    cell: ({ row }) => <Typography>{row.original.member_group_id}</Typography>,
                    size: 120
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: ({ row }) => <Typography>{row.original.status}</Typography>,
                    size: 100
                }),
                columnHelper.accessor('referrer', {
                    header: 'Refer By',
                    cell: ({ row }) => <Typography>{row.original.referrer}</Typography>,
                    size: 120
                }),
                columnHelper.accessor('remark', {
                    header: 'Remark',
                    cell: ({ row }) => <Typography> - </Typography>,
                    size: 150
                }),
                columnHelper.accessor('registration_created_at', {
                    header: 'Registration Date',
                    cell: ({ row }) => <Typography sx={{ textAlign: 'center' }}>{formatDateTime(row.original.registration_created_at)}</Typography>,
                    size: 200
                }),
            ];

            return [...otherColumns, registrationDomainColumn, registrationIpColumn];
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tableData, locale, isUserDetailModalOpen, selectedUsername, selectedUser] // Added dependencies for modal state
    )

    const table = useReactTable({
        data: tableData as MemberType[],
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
                <CardHeader title='Member List' className='pbe-4' />
                <TableFilters filters={filters} onFilterChange={onFilterChange} onSearch={onSearch} onClear={onClear} />
                <Divider />
                {/* <div className='flex justify-between gap-4 p-5 flex-col items-start sm:row-start-center'>
                    <Button
                        color='secondary'
                        variant='outlined'
                        startIcon={<i className='ri-upload-2-line' />}
                        className='max-sm:is-full'
                    >
                        Export
                    </Button>
                    <div className='flex items-center gap-x-4 max-sm:gap-y-4 flex-col max-sm:is-full sm:flex-row'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Search User'
                            className='max-sm:is-full'
                        />
                        <Button variant='contained' onClick={() => setAddUserOpen(!addUserOpen)} className='max-sm:is-full'>
                            Add New User
                        </Button>
                    </div>
                </div> */}
                <div className='overflow-x-auto'>
                    <table className={tableStyles.table} style={{ tableLayout: 'fixed' }}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} style={{ textAlign: 'center', width: header.getSize() }}>
                                            {header.isPlaceholder ? null : (
                                                <>
                                                    <div
                                                        className={classnames({
                                                            'flex items-center justify-center': header.column.getIsSorted(),
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
                                                    <td key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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
                user={selectedUser}
                open={isUserDetailModalOpen}
                onClose={() => {
                    setIsUserDetailModalOpen(false)
                    setSelectedUsername(null)
                    setSelectedUser(null)
                }}
            />
        </>
    )
}

export default MemberListTable
