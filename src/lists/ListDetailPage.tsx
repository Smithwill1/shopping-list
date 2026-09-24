import { useParams } from 'react-router-dom'

export function ListDetailPage() {
  const { id } = useParams()

  return (
    <section>
      <p>List {id} — items, groups and totals land in later phases.</p>
    </section>
  )
}
