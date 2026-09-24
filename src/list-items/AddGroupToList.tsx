import { useState } from 'react'
import { useGroups } from '../groups/useGroups'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GroupSelectionPanel } from './GroupSelectionPanel'
import type { ListItem } from './useListItems'

export function AddGroupToList({
  householdId,
  listId,
  listItems,
  onAdded,
}: {
  householdId: string
  listId: string
  listItems: ListItem[]
  onAdded: () => void
}) {
  const { groups, loading } = useGroups(householdId)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  if (loading || groups.length === 0) return null

  const selectedGroup = groups.find((group) => group.id === selectedGroupId)
  if (selectedGroup) {
    return (
      <GroupSelectionPanel
        key={selectedGroup.id}
        groupId={selectedGroup.id}
        groupName={selectedGroup.name}
        listId={listId}
        listItems={listItems}
        onCancel={() => setSelectedGroupId(null)}
        onConfirmed={() => {
          setSelectedGroupId(null)
          onAdded()
        }}
      />
    )
  }

  return (
    <Card>
      <CardContent>
        <h3 className="mb-2 text-base font-medium leading-snug">Add a group</h3>
        <div className="flex flex-col">
          {groups.map((group, index) => (
            <div key={group.id}>
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between gap-3 py-2">
                <span>{group.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
