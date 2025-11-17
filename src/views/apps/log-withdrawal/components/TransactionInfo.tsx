'use client'

// MUI Imports
import { Box, Table, TableBody, TableRow, TableCell, Chip, TextField, Button } from '@mui/material'

// Type Imports
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'

// Util Imports
import { formatDateTime } from '@/utils/dateFormatter'

type Props = {
  withdrawal: WithdrawalType
}

const TransactionInfo = ({ withdrawal }: Props) => {
  return (
    <Box border={1} borderRadius={2} p={2} mt={3}>
      <h4>Transaction Info</h4>
      <Table size='small'>
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
                  withdrawal.status === 0
                    ? 'default'
                    : withdrawal.status === 1
                      ? 'success'
                      : withdrawal.status === 2
                        ? 'error'
                        : 'warning'
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
        <TextField label='Remark' variant='outlined' fullWidth size='small' />
        <Button variant='contained' color='primary' sx={{ mt: 2 }}>
          Update
        </Button>
      </Box>
    </Box>
  )
}

export default TransactionInfo
