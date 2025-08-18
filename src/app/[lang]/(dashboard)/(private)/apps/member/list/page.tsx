// Component Imports
import MemberList from '@views/apps/member/list'

const getMemberListData = async () => {
    // Vars
    const res = await fetch('https://xpi.machibo.com/api/members?page=1', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer 15|PacmxeDeHKdBg43SXxnUeFAGaZBqULLHJ6gOlBRH97d96a2a'
        }
    })

    if (!res.ok) {
        throw new Error('Failed to fetch member data')
    }

    return res.json()
}

const MemberListApp = async () => {
    // Vars
    const data = await getMemberListData()
    console.log("data123", data?.data?.rows)

    return <MemberList memberData={data?.data?.rows} />
}

export default MemberListApp
