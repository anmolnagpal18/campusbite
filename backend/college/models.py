from django.db import models

class College(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    name = models.CharField(max_length=255, unique=True)
    city = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPROVED')

    def __str__(self):
        return self.name
