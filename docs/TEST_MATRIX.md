# Museum hardening test matrix

The hardening release is acceptable only when these historical behaviors remain intact:

1. Login with an existing normal user.
2. Login with a default-password user and complete forced password change.
3. Load equipment/assets and checklist definitions.
4. Submit a representative checklist and receive a tracking code.
5. Read history and inspection details.
6. Admin password reset remains functional for authorized admins.
7. Logout removes the active museum session.
8. Anonymous requests cannot enumerate users, inspections, or write storage objects.
9. No intentional CSS, layout, label, branding, or navigation changes.
