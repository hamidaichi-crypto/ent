// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { MemberType } from '@/types/apps/memberTypes'

// Component Imports
import MemberListTable from './MemberListTable'

const MemberList = ({ memberData }: { memberData?: MemberType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <MemberListTable tableData={memberData} />
      </Grid>
    </Grid>
  )
}

export default MemberList
