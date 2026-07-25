from django.db import transaction
from core.enums import ApprovalStatus
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
