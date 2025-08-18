// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'

// Component Imports
import WithdrawalListTable from './WithdrawalListTable'

const WithdrawalList = ({ withdrawalData }: { withdrawalData?: WithdrawalType[] }) => {
    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <WithdrawalListTable tableData={withdrawalData} />
            </Grid>
        </Grid>
    )
}

export default WithdrawalList
