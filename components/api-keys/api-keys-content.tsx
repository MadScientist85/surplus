"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createApiKey, revokeApiKey } from "@/lib/actions/api-key.actions"
import { Plus, Key, Copy, Trash2, Clock, Activity, Loader2, Check, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  keyHint: string
  permissions: string[]
  rateLimit: number
  lastUsedAt: Date | null
  usageCount: number
  expiresAt: Date | null
  createdAt: Date
}

interface ApiKeysContentProps {
  initialKeys: ApiKey[]
}

export function ApiKeysContent({ initialKeys }: ApiKeysContentProps) {
  const [keys, setKeys] = useState(initialKeys)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    permissions: ["read"] as string[],
    rateLimit: 1000,
  })
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createApiKey({
        name: newKeyData.name,
        permissions: newKeyData.permissions,
        rateLimit: newKeyData.rateLimit,
      })

      setNewlyCreatedKey(result.plainTextKey)
      toast({
        title: "API key created",
        description: "Make sure to copy your key now. You won't be able to see it again!",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKey(keyId)
      toast({ title: "API key revoked" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
    toast({ title: "Copied to clipboard" })
  }

  const togglePermission = (permission: string) => {
    setNewKeyData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const closeCreateDialog = () => {
    setIsCreateOpen(false)
    setNewlyCreatedKey(null)
    setNewKeyData({ name: "", permissions: ["read"], rateLimit: 1000 })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-amber-900/20 border-amber-600/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-amber-400">Keep your API keys secure</p>
            <p className="text-sm text-amber-300/80">
              Never share your API keys publicly or commit them to version control. Use environment variables for
              production.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {keys.length} active key{keys.length !== 1 ? "s" : ""}
        </p>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (!open) closeCreateDialog()
            else setIsCreateOpen(true)
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-500">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-orange-900/50">
            {newlyCreatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>Copy your API key now. You will not be able to see it again!</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-800 rounded-lg border border-orange-900/50">
                    <code className="text-sm text-green-400 break-all">{newlyCreatedKey}</code>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(newlyCreatedKey, "new")}
                    className="w-full bg-orange-600 hover:bg-orange-500"
                  >
                    {copiedKeyId === "new" ? (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" /> Copy API Key
                      </>
                    )}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={closeCreateDialog}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>Generate a new API key for programmatic access</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Key Name</Label>
                    <Input
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                      placeholder="Production API Key"
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["read", "write", "delete", "admin"].map((perm) => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm}
                            checked={newKeyData.permissions.includes(perm)}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                          <Label htmlFor={perm} className="capitalize">
                            {perm}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rate Limit (requests/hour)</Label>
                    <Input
                      type="number"
                      value={newKeyData.rateLimit}
                      onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: Number.parseInt(e.target.value) })}
                      min={100}
                      max={10000}
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeCreateDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Key
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <Card className="bg-neutral-900 border-orange-900/50">
          <CardContent className="p-12 text-center">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No API keys yet</h3>
            <p className="text-muted-foreground mb-4">Create an API key to access the HBU Recovery API</p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-600 hover:bg-orange-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <Card key={key.id} className="bg-neutral-900 border-orange-900/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-orange-500" />
                      <h3 className="font-medium text-white">{key.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-sm text-muted-foreground bg-neutral-800 px-2 py-1 rounded">
                        {key.keyPrefix}...{key.keyHint}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${key.keyPrefix}...${key.keyHint}`, key.id)}
                        className="h-7 px-2"
                      >
                        {copiedKeyId === key.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {key.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs capitalize">
                          {perm}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {formatDate(key.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Last used: {formatDate(key.lastUsedAt)}
                      </span>
                      <span>{key.usageCount.toLocaleString()} requests</span>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 border-red-900/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Any applications using this key will lose access immediately.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevokeKey(key.id)}
                          className="bg-red-600 hover:bg-red-500"
                        >
                          Revoke Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Quick reference for using your API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Authentication Header:</p>
            <code className="block p-3 bg-neutral-800 rounded text-sm text-green-400">
              Authorization: Bearer {"<your-api-key>"}
            </code>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Example Request:</p>
            <code className="block p-3 bg-neutral-800 rounded text-sm text-green-400 whitespace-pre">
              {`curl -X GET https://hbu.app/api/v1/leads \\
  -H "Authorization: Bearer hbu_live_..." \\
  -H "Content-Type: application/json"`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
