import { useState } from 'react'
import { Check, X, Edit2, User, Mail, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import { getAccessToken, supabase } from '~/lib/supabase/client'
import { toast } from 'sonner'
import { updateUserBasicInformation, uploadAvatar } from '~/lib/api/patch'

const ProfilePage = () => {
    const { user, setUser, loading, setLoading } = useUserStore()

    const [editingField, setEditingField] = useState<string | null>(null)
    const [tempValue, setTempValue] = useState('')
    const [isProfileUpdating, setIsProfileUpdating] = useState<boolean>(false)
    const [isPasswordChanging, setIsPasswordChanging] = useState<boolean>(false)
    const [isAvatarUploading, setIsAvatarUploading] = useState<boolean>(false)

    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false)
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })
    const [passwordError, setPasswordError] = useState('')

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    })

    // NEW: State to manage email confirmation message
    const [emailConfirmation, setEmailConfirmation] = useState<any>()

    const startEdit = (field: string, currentValue?: string) => {
        setEditingField(field)
        setTempValue(currentValue || '')
        if (field === 'email') {
            setEmailConfirmation(null)
        }
    }

    const cancelEdit = () => {
        setEditingField(null)
        setTempValue('')
        setEmailConfirmation(null)
    }

    const saveEditBasicInformation = async (field: 'full_name' | 'email') => {
        if (!user) return
        if (tempValue.trim() === user?.[field]) {
            cancelEdit()
            return
        }

        // USE SUPABASE SDK FOR EMAIL CHANGE PROCESS
        if (field === 'email') {
            setIsProfileUpdating(true)

            const { data, error } = await supabase.auth.updateUser({
                email: tempValue.trim(),
            })

            if (error) {
                alert('Failed to update email: ' + error.message)
                setIsProfileUpdating(false)
                return
            }

            const emailConfirmationElement = (
                <>
                    Confirmation email sent!
                    <br />
                    <br />
                    Please check{' '}
                    <span className="text-gray-900 font-semibold">{tempValue.trim()}</span> and
                    click the confirmation link.
                    <br />
                    <br />
                    Your email will be updated after confirmation.
                </>
            )
            setEmailConfirmation(emailConfirmationElement)

            setIsProfileUpdating(false)
            setEditingField(null)
            setTempValue('')
            return
        }

        setIsProfileUpdating(true)
        try {
            const formData = new FormData()
            formData.append(field, tempValue.trim())

            const updateResults = await updateUserBasicInformation(formData)

            if (updateResults) {
                setUser({
                    ...user!,
                    ...updateResults,
                })
            }
            setEditingField(null)
            setTempValue('')
        } catch (error) {
            console.error('Failed to update:', error)
        } finally {
            setIsProfileUpdating(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAvatarUploading(true)
        try {
            const formData = new FormData()
            formData.append('avatar', file)

            const uploadResult = await uploadAvatar(formData)
            if (uploadResult && typeof uploadResult === 'object') {
                setUser({
                    ...user!,
                    ...(uploadResult.avatar_url
                        ? { avatar_url: uploadResult.avatar_url }
                        : uploadResult),
                })
            }
        } catch (error) {
            console.error('Failed to upload:', error)
        } finally {
            setIsAvatarUploading(false)
        }
    }

    // Password change handlers
    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData((prev) => ({
            ...prev,
            [field]: value,
        }))
        setPasswordError('')
    }

    const togglePasswordVisibility = (field: string) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field as keyof typeof prev]: !prev[field as keyof typeof prev],
        }))
    }

    const handlePasswordSave = async () => {
        if (
            !passwordData.current_password ||
            !passwordData.new_password ||
            !passwordData.confirm_password
        ) {
            setPasswordError('All password fields are required')
            return
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('New passwords do not match')
            return
        }

        if (passwordData.new_password.length < 6) {
            setPasswordError('Password must be at least 6 characters')
            return
        }

        setIsPasswordChanging(true)

        try {
            // Check if current password is correct by reauthenticating
            if (user) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: passwordData.current_password,
                })

                if (error) {
                    setPasswordError('Current password is incorrect')
                    setIsPasswordChanging(false)
                    return
                }
            } else {
                setPasswordError('User not found.')
                setIsPasswordChanging(false)
                return
            }

            // 2. Proceed to update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.new_password,
            })

            if (updateError) {
                setPasswordError('Failed to update password. Please try again.')
            } else {
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                })
                setShowPasswordSection(false)
                setPasswordError('')
                toast.success('Password updated successfully!')
            }
        } catch (err) {
            console.error('Failed to update password:', err)
            setPasswordError('Failed to update password. Please try again.')
        } finally {
            setIsPasswordChanging(false)
        }
    }

    // Show a loading indicator overlay when loading is true
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-lg text-gray-500 font-medium">Loading profile...</div>
            </div>
        )
    }

    if (!loading && !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-lg text-gray-500 font-medium">No user data found.</div>
            </div>
        )
    }

    // At this point, user is defined (not null)
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="w-full mx-auto px-4">
                <div className="flex flex-col mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                    <h2 className="text-md text-blue-600 font-normal mt-1">
                        Your personal information and settings
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 ">
                    {/* Header */}
                    <div className="bg-linear-to-r from-blue-500 to-blue-600 h-24 rounded-t-xl"></div>

                    {/* Avatar Section */}
                    <div className="px-6 sm:px-8 pb-5">
                        <div className="flex flex-col items-center -mt-12">
                            <div className="relative group">
                                {isAvatarUploading ? (
                                    <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-200 border-4 border-white shadow-lg">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                    </div>
                                ) : user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.full_name || 'User'}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-3xl border-4 border-white shadow-lg">
                                        {user?.full_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}

                                {/* Upload overlay */}
                                <label
                                    className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full transition-opacity cursor-pointer 
                                        ${isAvatarUploading ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}
                                    `}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={isAvatarUploading}
                                    />
                                    <Edit2 className="w-6 h-6 text-white" />
                                </label>
                            </div>

                            <p className="text-xs text-gray-500 mt-3">Click avatar to change</p>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="mt-6 space-y-6 px-5">
                        {/* Full Name */}
                        <div className="group">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    Full Name
                                </label>
                                {editingField !== 'full_name' && (
                                    <button
                                        onClick={() => startEdit('full_name', user?.full_name)}
                                        className="text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={loading}
                                    >
                                        <Edit2 className="w-5 h-5 hover:cursor-pointer hover:opacity-75" />
                                    </button>
                                )}
                            </div>

                            {editingField === 'full_name' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        autoFocus
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={() => saveEditBasicInformation('full_name')}
                                        disabled={isProfileUpdating}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isProfileUpdating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        disabled={isProfileUpdating}
                                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                    <p className="text-gray-900 text-sm">
                                        {user?.full_name || 'Not set'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="group">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    Email
                                </label>
                                {editingField !== 'email' && (
                                    <button
                                        onClick={() => startEdit('email', user?.email)}
                                        className="text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={isProfileUpdating}
                                    >
                                        <Edit2 className="w-5 h-5 hover:cursor-pointer hover:opacity-75" />
                                    </button>
                                )}
                            </div>

                            {editingField === 'email' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        autoFocus
                                        disabled={isProfileUpdating}
                                    />
                                    <button
                                        onClick={() => saveEditBasicInformation('email')}
                                        disabled={isProfileUpdating}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isProfileUpdating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        disabled={isProfileUpdating}
                                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                        <p className="text-gray-900 text-sm">
                                            {user?.email || 'Not set'}
                                        </p>
                                    </div>
                                    {/* GREEN CARD: Email sent confirmation */}
                                    {emailConfirmation && (
                                        <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg whitespace-pre-line">
                                            <p className="text-xs">{emailConfirmation}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Change Password Section */}
                        <div className="pt-6 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowPasswordSection(!showPasswordSection)
                                    setPasswordError('')
                                    if (showPasswordSection) {
                                        setPasswordData({
                                            current_password: '',
                                            new_password: '',
                                            confirm_password: '',
                                        })
                                    }
                                }}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:opacity-75 hover:cursor-pointer transition-colors mb-5"
                            >
                                <Lock
                                    className={`w-4 h-4 ${showPasswordSection ? 'text-red-600' : ''}`}
                                />
                                {showPasswordSection ? (
                                    <span className="text-red-600">Cancel Password Change</span>
                                ) : (
                                    'Change Password'
                                )}
                            </button>

                            {showPasswordSection && (
                                <div className="mt-4 space-y-4">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordData.current_password}
                                                onChange={(e) =>
                                                    handlePasswordChange(
                                                        'current_password',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordData.new_password}
                                                onChange={(e) =>
                                                    handlePasswordChange(
                                                        'new_password',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordData.confirm_password}
                                                onChange={(e) =>
                                                    handlePasswordChange(
                                                        'confirm_password',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Error */}
                                    {passwordError && (
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                            <p className="text-xs text-red-700">{passwordError}</p>
                                        </div>
                                    )}

                                    {/* Password Save Button */}
                                    <button
                                        onClick={handlePasswordSave}
                                        disabled={isPasswordChanging}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                    >
                                        {isPasswordChanging ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Updating Password...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 mx-5 mb-8">
                        <p className="text-xs text-blue-700">
                            <strong>Tip:</strong> Click the edit icon next to any field to update
                            your information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
