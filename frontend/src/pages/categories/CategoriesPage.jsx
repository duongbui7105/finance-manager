import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, Tag, AlertCircle
} from "lucide-react";
import { categoryApi } from "../../api/transactionApi";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../hooks/useToast";

const EMPTY_FORM = { name: "", icon: "" };

// Common category icons
const ICON_OPTIONS = [
  "food", "transport", "shopping", "entertainment", "health",
  "education", "bills", "savings", "gift", "travel",
  "sport", "beauty", "pet", "home", "work"
];

function CategoryForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2)
      e.name = "Tên danh mục phải có ít nhất 2 ký tự";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: form.name.trim(), icon: form.icon });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="label">Tên danh mục *</label>
        <input
          type="text"
          value={form.name}
          onChange={handleChange("name")}
          placeholder="Ví dụ: Ăn uống, Di chuyển..."
          className={`input ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
          autoFocus
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="label">Biểu tượng (tùy chọn)</label>
        <div className="grid grid-cols-5 gap-2 mb-2">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm((p) => ({ ...p, icon }))}
              className={`p-2 rounded-lg border text-xs transition-all ${
                form.icon === icon
                  ? "bg-blue-500 text-white border-blue-500 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={form.icon}
          onChange={handleChange("icon")}
          placeholder="Hoặc nhập tên icon..."
          className="input text-sm"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? <Spinner size="sm" /> : initial ? "Cập nhật" : "Tạo mới"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

function CategoryCard({ category, onEdit, onDelete, disabled }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm">
            {category.icon ? (
              <span className="text-blue-600">{category.icon}</span>
            ) : (
              <Tag className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            <p className="text-xs text-gray-500">
              {category.isSystemCategory ? "Danh mục hệ thống" : "Danh mục của bạn"}
            </p>
          </div>
        </div>

        {!category.isSystemCategory && (
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(category)}
              disabled={disabled}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(category)}
              disabled={disabled}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryApi.getAll();
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (data) => {
    try {
      setActionLoading(true);
      await categoryApi.create(data);
      toast.success("Tạo danh mục thành công");
      setShowAddModal(false);
      fetchCategories();
    } catch (err) {
      console.error("Failed to create category:", err);
      toast.error(err.response?.data?.message || "Không thể tạo danh mục");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    try {
      setActionLoading(true);
      await categoryApi.update(editCategory.id, data);
      toast.success("Cập nhật danh mục thành công");
      setEditCategory(null);
      fetchCategories();
    } catch (err) {
      console.error("Failed to update category:", err);
      toast.error(err.response?.data?.message || "Không thể cập nhật danh mục");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await categoryApi.remove(deleteCategory.id);
      toast.success("Xóa danh mục thành công");
      setDeleteCategory(null);
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
      toast.error(
        err.response?.data?.message || "Không thể xóa danh mục. Có thể danh mục đang được sử dụng."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const userCategories = categories.filter((c) => !c.isSystemCategory);
  const systemCategories = categories.filter((c) => c.isSystemCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tạo và quản lý các danh mục cho giao dịch của bạn
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tạo danh mục
        </button>
      </div>

      {/* User Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Danh mục của bạn ({userCategories.length})
        </h2>
        {userCategories.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Chưa có danh mục tùy chỉnh"
            description="Tạo danh mục riêng để phù hợp với nhu cầu của bạn"
            actionLabel="Tạo danh mục đầu tiên"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={setEditCategory}
                onDelete={setDeleteCategory}
                disabled={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* System Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Danh mục hệ thống ({systemCategories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={setEditCategory}
              onDelete={setDeleteCategory}
              disabled={true}
            />
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          title="Tạo danh mục mới"
          onClose={() => setShowAddModal(false)}
          size="md"
        >
          <CategoryForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddModal(false)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editCategory && (
        <Modal
          title="Chỉnh sửa danh mục"
          onClose={() => setEditCategory(null)}
          size="md"
        >
          <CategoryForm
            initial={{ name: editCategory.name, icon: editCategory.icon || "" }}
            onSubmit={handleUpdate}
            onCancel={() => setEditCategory(null)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteCategory && (
        <Modal
          title="Xác nhận xóa"
          onClose={() => setDeleteCategory(null)}
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Bạn có chắc chắn muốn xóa danh mục{" "}
                  <strong>{deleteCategory.name}</strong>?
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Danh mục đang được sử dụng sẽ không thể xóa.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="btn-danger flex-1"
              >
                {actionLoading ? <Spinner size="sm" /> : "Xóa"}
              </button>
              <button
                onClick={() => setDeleteCategory(null)}
                disabled={actionLoading}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
