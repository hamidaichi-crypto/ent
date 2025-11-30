'use client'

// React Imports
import { useEffect, useState, useRef, useCallback } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider';
import { Tabs, Tab, Box, Grid, Table, TableBody, TableRow, TableCell, TableHead, TablePagination } from '@mui/material'

// Type Imports
import type { MemberType, Pagination } from '@/types/apps/memberTypes'
import type { WalletInfo, WalletLog, PromotionLog } from '@/types/apps/walletTypes'

// Util Imports
import { useFetchData } from '@/utils/api'
import { formatDateTime } from '@/utils/dateFormatter'

// --- User Detail Modal Component ---
const UserDetailModal = ({
  username,
  user,
  userId,
  withdrawId,
  open,
  onClose,
  defaultTab
}: {
  username: string | null
  userId: number | null
  withdrawId?: number | null
  user: MemberType | null
  open: boolean
  onClose: () => void
  defaultTab?: number
}) => {
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

  const [walletLogsPage, setWalletLogsPage] = useState(0)
  const [walletLogsPagination, setWalletLogsPagination] = useState<Pagination | null>(null)

  const [tabValue, setTabValue] = useState(defaultTab || 0)

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
      cacheRef.current[uname] = response?.data // ✅ cache it
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError('Failed to load user data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("load user info")
    if (!open || !username || !userId) return

    // loadUserData(username)

    // ✅ If cached, use it immediately
    if (cacheRef.current[username]) {
      console.log("load user info cachews", cacheRef.current[username])
      setUserData(cacheRef.current[username])
      setLoading(false)
      setError(null)
    } else {
      // Otherwise fetch from API
      console.log("load user info from api")
      loadUserData(username)
    }
  }, [username, open, userId])

  // Fetch wallet info when tab is clicked
  useEffect(() => {
    const loadWalletData = async () => {
      if (tabValue === 1 && username && userId && !walletData) {
        setWalletLoading(true)
        setWalletError(null)
        try {
          const response = await fetchData(`/members/game_wallets?username=${username}&user_id=${userId}`)
          setWalletData(response?.data)
        } catch (err) {
          setWalletError('Failed to load wallet data.')
        } finally {
          setWalletLoading(false)
        }
      }
    }

    loadWalletData()
  }, [tabValue, username, walletData, fetchData, userId])

  // Fetch wallet logs when tab is clicked
  useEffect(() => {
    const loadWalletLogs = async (page: number) => {
      if (tabValue === 2 && userId) {
        setWalletLogs(null) // Always clear previous logs before fetching
        setWalletLogsError(null)
        setWalletLogsLoading(true)
        try {
          const response = await fetchData(`/members/wallet_logs?user_id=${userId}&page=10&page=${page + 1}`)

          setWalletLogs(response?.data?.logs || [])
          setWalletLogsPagination(response?.data?.paginations || null)
        } catch (err) {
          setWalletLogsError('Failed to load wallet logs.')
        } finally {
          setWalletLogsLoading(false)
        }
      }
    }

    loadWalletLogs(walletLogsPage)
  }, [tabValue, userId, fetchData, withdrawId, walletLogsPage])

  // Fetch promotion logs when tab is clicked
  useEffect(() => {
    const loadPromotionLogs = async () => {
      if (tabValue === 3 && userId && !promotionLogs) {
        setPromotionLogsLoading(true)
        setPromotionLogsError(null)
        try {
          const response = await fetchData(`/members/promotion_logs?user_id=${userId}&page=1`)

          setPromotionLogs(response?.data?.logs || [])
        } catch (err) {
          setPromotionLogsError('Failed to load promotion logs.')
        } finally {
          setPromotionLogsLoading(false)
        }
      }
    }

    loadPromotionLogs()
  }, [tabValue, userId, promotionLogs, fetchData])

  // Don’t clear cache on close → only reset modal state
  useEffect(() => {
    // Reset tab and data on close
    if (!open) { // When the modal is closed
      setTabValue(defaultTab || 0)
      setWalletData(null)
      setWalletLogs(null)
      setPromotionLogs(null)
      setWalletLogsPage(0)
      setError(null)
      setTabValue(0)
      setWalletLogsPagination(null)
      setUserData(null) // clear local state, but keep cache
    }
  }, [open, defaultTab])

  useEffect(() => {
    if (open) {
      setTabValue(defaultTab || 0)
    }
  }, [open, defaultTab])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xl' sx={{ '& .MuiDialog-paper': { minHeight: '80vh' } }}>
      <DialogTitle className='flex justify-between items-center'>
        Info {user?.username} ({user?.id})
        <IconButton onClick={onClose} className='absolute block-start-4 inline-end-4'>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <>
        {/* Tabs */}
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label='Basic Info' />
          <Tab label='Wallet Info' />
          <Tab label='Wallet Logs' />
          <Tab label='Promotion History' />
        </Tabs>
        <DialogContent sx={{ pb: 20 }}>
          {tabValue === 0 && (
            <>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                  <CircularProgress size={24} /> <Typography>Loading basic info...</Typography>
                </Box>
              )}
              {error && <Typography color='error'>{error}</Typography>}

              {userData && !loading && (
                <>
                  <Card sx={{ mt: 2 }}>
                    <CardHeader
                      title='Member Basic Info'
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
                    <Collapse in={openBasicInfo} timeout='auto' unmountOnExit>
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
                                <Typography variant='body2' color='textSecondary'>
                                  {item.label}
                                </Typography>
                                <Typography variant='subtitle2'>{item.value}</Typography>
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
                      title='Wallet Info'
                      action={
                        <IconButton onClick={() => setOpenAccountInfo(prev => !prev)}>
                          <i
                            className='ri-arrow-down-s-line'
                            style={{
                              transform: openAccountInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: '0.3s',
                              fontSize: '1.2rem'
                            }}
                          />
                        </IconButton>
                      }
                    />
                    <Collapse in={openAccountInfo} timeout='auto' unmountOnExit>
                      <Divider />
                      <Box p={2}>
                        {/* Wallet Info Table */}
                        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}></Typography>
                        <Table size='small'>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <strong>Main Wallet</strong>
                              </TableCell>
                              <TableCell>{walletData?.main_wallet ?? '-'}</TableCell>
                              <TableCell>
                                <strong>Game Wallets Count</strong>
                              </TableCell>
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
                      title='Account & Wallet Info'
                      action={
                        <IconButton onClick={() => setOpenAccountInfo(prev => !prev)}>
                          <i
                            className='ri-arrow-down-s-line'
                            style={{
                              transform: openAccountInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: '0.3s',
                              fontSize: '1.2rem'
                            }}
                          />
                        </IconButton>
                      }
                    />
                    <Collapse in={openAccountInfo} timeout='auto' unmountOnExit>
                      <Divider />
                      <Box p={2}>
                        {/* Account Info Table */}
                        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
                          Account Info
                        </Typography>
                        <Table size='small' sx={{ mb: 4 }}>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <strong>Campaign</strong>
                              </TableCell>
                              <TableCell colSpan={5}>{userData.campaign_name ?? '-'}</TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell>
                                <strong>Affiliate</strong>
                              </TableCell>
                              <TableCell>{userData.affiliate_username ?? '-'}</TableCell>
                              <TableCell>
                                <strong>Telemarketer</strong>
                              </TableCell>
                              <TableCell>{userData.referrer ?? '-'}</TableCell>
                              <TableCell>
                                <strong>Agent</strong>
                              </TableCell>
                              <TableCell>{userData.agents_name ?? '-'}</TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell>
                                <strong>Referrer</strong>
                              </TableCell>
                              <TableCell>{userData.referrer ?? '-'}</TableCell>
                              <TableCell>
                                <strong>Referral Code</strong>
                              </TableCell>
                              <TableCell>{userData.referrer ?? '-'}</TableCell>
                              <TableCell>
                                <strong>Referral Count</strong>
                              </TableCell>
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

          {tabValue === 1 && userId && (
            <>
              {walletLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                  <CircularProgress size={24} /> <Typography>Loading wallet info...</Typography>
                </Box>
              )}

              {walletError && <Typography color='error'>{walletError}</Typography>}
              {walletData && (
                <>
                  <Box border={0} borderRadius={0} p={2}>
                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                      <Typography variant='subtitle1'>
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

                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Game Provider</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Username</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Password</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Currency</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Balance</strong>
                          </TableCell>
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
                            <TableCell colSpan={6} align='center'>
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

          {tabValue === 2 && userId && (
            <>
              {/* ===== Wallet Logs ===== */}
              {walletLogsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                  <CircularProgress size={24} /> <Typography>Loading wallet logs...</Typography>
                </Box>
              )}
              {walletLogsError && <Typography color='error'>{walletLogsError}</Typography>}
              {walletLogs && (
                <Table size='small' sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Transaction Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Operator</TableCell>
                      {withdrawId && (
                        <TableCell>Username(Withdraw ID)</TableCell>
                      )}
                      <TableCell>Status</TableCell>

                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {walletLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.created_at)}</TableCell>
                        <TableCell>{log.transaction_type}</TableCell>
                        <TableCell>{log.amount}</TableCell>
                        <TableCell>{log.balance}</TableCell>
                        <TableCell>{log.details ?? '-'}</TableCell>
                        <TableCell>{log.operator}</TableCell>
                        {withdrawId && <TableCell>{log.username} ({withdrawId})</TableCell>}
                        <TableCell>{log.status_name}</TableCell>
                      </TableRow>
                    ))}

                    {/* Fallback if no wallet logs */}
                    {(!walletLogs || walletLogs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          No wallet logs available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {walletLogsPagination && (
                <TablePagination
                  component='div'
                  count={walletLogsPagination.total}
                  page={walletLogsPage}
                  onPageChange={(event, newPage) => setWalletLogsPage(newPage)}
                  rowsPerPage={parseInt(walletLogsPagination.per_page, 10)}
                  onRowsPerPageChange={() => {
                    // Not implemented as per_page is fixed from API
                  }}
                  rowsPerPageOptions={[]} // Hide rows per page options
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                  }
                />
              )}
            </>
          )}
          {
            tabValue === 3 && userId && (

              <>
                {/* ===== Promotion History ===== */}
                {promotionLogsLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, gap: 2 }}>
                    <CircularProgress size={24} /> <Typography>Loading promotion history...</Typography>
                  </Box>
                )}
                {promotionLogsError && <Typography color='error'>{promotionLogsError}</Typography>}
                {promotionLogs && (
                  <Table size='small' sx={{ mt: 2 }}>
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
                      {promotionLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDateTime(log.created_at)}</TableCell>
                          <TableCell dangerouslySetInnerHTML={{ __html: log.promo_code }} />
                          <TableCell>{log.amount}</TableCell>
                          <TableCell>{log.bonus_amount}</TableCell>
                          <TableCell>
                            {log.accumulated_target_amount} / {log.target_amount}
                          </TableCell>
                          <TableCell>{log.status_name}</TableCell>
                        </TableRow>
                      ))}

                      {/* Fallback if no wallet logs */}
                      {(!promotionLogs || promotionLogs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} align='center'>
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

export default UserDetailModal
