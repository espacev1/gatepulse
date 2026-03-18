import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Linkedin, Mail, Phone, Save, X, ArrowUp, ArrowDown, User, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function TeamManagement() {
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        image_url: '',
        linkedin_url: '',
        email: '',
        phone: '',
        description: '',
        display_order: 0
    })

    useEffect(() => {
        fetchMembers()
    }, [])

    const fetchMembers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('display_order', { ascending: true })
        
        if (error) {
            console.error('Error fetching team members:', error)
        } else {
            setMembers(data || [])
        }
        setLoading(false)
    }

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member)
            setFormData({ ...member })
        } else {
            setEditingMember(null)
            setFormData({
                name: '',
                designation: '',
                image_url: '',
                linkedin_url: '',
                email: '',
                phone: '',
                description: '',
                display_order: members.length
            })
        }
        setIsModalOpen(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (editingMember) {
            const { error } = await supabase
                .from('team_members')
                .update(formData)
                .eq('id', editingMember.id)
            
            if (error) alert('Error updating member: ' + error.message)
            else setIsModalOpen(false)
        } else {
            const { error } = await supabase
                .from('team_members')
                .insert([formData])
            
            if (error) alert('Error adding member: ' + error.message)
            else setIsModalOpen(false)
        }

        fetchMembers()
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return
        
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id)
        
        if (error) alert('Error deleting member: ' + error.message)
        else fetchMembers()
    }

    const swapOrder = async (index1, index2) => {
        const m1 = members[index1]
        const m2 = members[index2]
        
        const { error: err1 } = await supabase
            .from('team_members')
            .update({ display_order: m2.display_order })
            .eq('id', m1.id)
        
        const { error: err2 } = await supabase
            .from('team_members')
            .update({ display_order: m1.display_order })
            .eq('id', m2.id)

        if (err1 || err2) alert('Error updating order')
        else fetchMembers()
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Team Management</h1>
                    <p className="page-subtitle">Add or remove members from the About Us section on the home page.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Team Member
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Order</th>
                                <th>Member</th>
                                <th>Designation</th>
                                <th>Social Links</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && members.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12">LOADING TEAM MEMBERS...</td></tr>
                            ) : members.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12">NO TEAM MEMBERS ADDED YET</td></tr>
                            ) : members.map((m, i) => (
                                <tr key={m.id}>
                                    <td>
                                        <div className="flex flex-col gap-1 items-center">
                                            <button 
                                                disabled={i === 0} 
                                                onClick={() => swapOrder(i, i - 1)}
                                                className="btn-icon" 
                                                style={{ opacity: i === 0 ? 0.2 : 1 }}
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button 
                                                disabled={i === members.length - 1} 
                                                onClick={() => swapOrder(i, i + 1)}
                                                className="btn-icon"
                                                style={{ opacity: i === members.length - 1 ? 0.2 : 1 }}
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                                                background: 'var(--bg-mid)', overflow: 'hidden', border: '1px solid var(--border-color)'
                                            }}>
                                                {m.image_url ? (
                                                    <img src={m.image_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><User size={20} color="var(--text-dim)" /></div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{m.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '200px' }} className="truncate">{m.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-primary">{m.designation}</span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {m.linkedin_url && <Linkedin size={14} color="var(--accent)" />}
                                            {m.email && <Mail size={14} color="var(--secondary)" />}
                                            {m.phone && <Phone size={14} color="var(--teal)" />}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex justify-end gap-2">
                                            <button className="btn-icon" onClick={() => handleOpenModal(m)}><Edit2 size={16} /></button>
                                            <button className="btn-icon" onClick={() => handleDelete(m.id)}><Trash2 size={16} color="var(--status-critical)" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingMember ? 'Edit Team Member' : 'Add New Member'}</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label"><User size={12} /> Full Name</label>
                                    <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Alex Rivera" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><ShieldCheck size={12} /> Designation</label>
                                    <input className="form-input" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="e.g. Lead Architect" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label"><ImageIcon size={12} /> Image URL</label>
                                <input className="form-input" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://example.com/photo.jpg" />
                            </div>

                            <div className="grid-3">
                                <div className="form-group">
                                    <label className="form-label"><Linkedin size={12} /> LinkedIn URL</label>
                                    <input className="form-input" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} placeholder="URL" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Mail size={12} /> Email</label>
                                    <input className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="example@mail.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Phone size={12} /> Phone</label>
                                    <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+123..." />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label"><FileText size={12} /> Bio / Description</label>
                                <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="A short description about the team member..." />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Save size={18} /> {editingMember ? 'Save Changes' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
