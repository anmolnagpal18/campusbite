from django.db import transaction
from core.enums import ApprovalStatus, ShopStatus
from accounts.models import ApprovalLog

class ApprovalService:
    @staticmethod
    def approve_profile(profile, approved_by=None, remarks=None):
        with transaction.atomic():
            profile.status = ApprovalStatus.APPROVED
            profile.save()
            
            # If CollegeAdmin is approved, approve the College too!
            if hasattr(profile, 'college') and profile.college.status != ApprovalStatus.APPROVED:
                profile.college.status = ApprovalStatus.APPROVED
                profile.college.save()
            
            ApprovalLog.objects.create(
                user=profile.user,
                approved_by=approved_by,
                role=profile.user.role,
                action=ApprovalStatus.APPROVED,
                remarks=remarks
            )
            return profile

    @staticmethod
    def reject_profile(profile, approved_by=None, remarks=None):
        with transaction.atomic():
            profile.status = ApprovalStatus.REJECTED
            profile.save()
            
            ApprovalLog.objects.create(
                user=profile.user,
                approved_by=approved_by,
                role=profile.user.role,
                action=ApprovalStatus.REJECTED,
                remarks=remarks
            )
            return profile

class AccountDeactivationService:
    @staticmethod
    def deactivate_vendor(vendor_profile, actioned_by=None, remarks=None):
        with transaction.atomic():
            user = vendor_profile.user
            user.is_active = False
            user.save()

            # Cascade: Restaurant CLOSED, accepting_orders = False
            if hasattr(vendor_profile, 'restaurant'):
                restaurant = vendor_profile.restaurant
                restaurant.status = ShopStatus.CLOSED
                restaurant.accepting_orders = False
                restaurant.save()

            # Cascade: staff members become inactive
            for staff in vendor_profile.staff_members.all():
                staff_user = staff.user
                staff_user.is_active = False
                staff_user.save()

            ApprovalLog.objects.create(
                user=user,
                approved_by=actioned_by,
                role=user.role,
                action="DEACTIVATE",
                remarks=remarks or "Vendor deactivated. Restaurant closed and staff members disabled."
            )
            return vendor_profile

    @staticmethod
    def restore_vendor(vendor_profile, actioned_by=None, remarks=None):
        with transaction.atomic():
            user = vendor_profile.user
            user.is_active = True
            user.save()

            # Cascade: restore staff members is_active
            for staff in vendor_profile.staff_members.all():
                staff_user = staff.user
                staff_user.is_active = True
                staff_user.save()

            ApprovalLog.objects.create(
                user=user,
                approved_by=actioned_by,
                role=user.role,
                action="RESTORE",
                remarks=remarks or "Vendor restored. Staff members re-enabled."
            )
            return vendor_profile

    @staticmethod
    def deactivate_user_account(user, actioned_by=None, remarks=None):
        with transaction.atomic():
            user.is_active = False
            user.save()

            ApprovalLog.objects.create(
                user=user,
                approved_by=actioned_by,
                role=user.role,
                action="DEACTIVATE",
                remarks=remarks or "User account deactivated."
            )
            return user

    @staticmethod
    def restore_user_account(user, actioned_by=None, remarks=None):
        with transaction.atomic():
            user.is_active = True
            user.save()

            ApprovalLog.objects.create(
                user=user,
                approved_by=actioned_by,
                role=user.role,
                action="RESTORE",
                remarks=remarks or "User account restored."
            )
            return user

