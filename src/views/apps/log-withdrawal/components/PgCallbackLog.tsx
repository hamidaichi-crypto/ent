'use client'

// MUI Imports
import { Box, Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress } from '@mui/material'

// Type Imports
import type { PgLog } from '@/types/apps/withdrawalTypes'

// Util Imports
import { formatDateTime } from '@/utils/dateFormatter'

type Props = {
  pgLogs: PgLog[]
  isSubmitting: boolean
}

const PgCallbackLog = ({ pgLogs, isSubmitting }: Props) => {
  return (
    <Box border={1} borderRadius={2} p={2} mt={3}>
      <h4>Payment Gateway Callback Log</h4>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Callback ID</TableCell>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Payment JSON</TableCell>
            <TableCell>Callback Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isSubmitting ? (
            <TableRow>
              <TableCell colSpan={6} align='center'>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : pgLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align='center'>
                No data available
              </TableCell>
            </TableRow>
          ) : (
            pgLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{log.id}</TableCell>
                <TableCell>{log.transaction_id}</TableCell>
                <TableCell>
                  <Chip
                    label={log.status_label}
                    size='small'
                    variant='tonal'
                    color={log.status_label === 'Rejected' ? 'error' : 'success'}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 300, wordBreak: 'break-all' }}>{log.payment_json}</TableCell>
                <TableCell>{formatDateTime(log.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

export default PgCallbackLog
