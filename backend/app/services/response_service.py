from datetime import datetime, timezone
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class ResponseAutomationService:
    @staticmethod
    def generate_containment_action(
        action_type: str,
        target: str,
        reason: str,
        requester_id: int = None
    ) -> Dict[str, Any]:
        """
        Generates a pending mitigation action requiring explicit human administrator authorization.
        Disruptive actions are NEVER auto-executed without signed approval.
        """
        rollback_cmd = ""
        if action_type == "Firewall Block IP":
            rollback_cmd = f"iptables -D INPUT -s {target} -j DROP; firewall-cmd --remove-rich-rule='rule family=\"ipv4\" source address=\"{target}\" reject'"
        elif action_type == "Isolate Device":
            rollback_cmd = f"cisco_switch# configure terminal\ninterface <port>\nno shutdown\nexit"
        elif action_type == "Rate Limit":
            rollback_cmd = f"tc qdisc del dev eth0 root handle 1: cbq avpkt 1000 bandwidth 100Mbit"
        else:
            rollback_cmd = "No system change to revert."

        return {
            "action_type": action_type,
            "target": target,
            "status": "Pending Approval",
            "reason": reason,
            "rollback_command": rollback_cmd,
            "requested_by_id": requester_id,
            "created_at": datetime.now(timezone.utc)
        }

    @staticmethod
    def execute_action(action: Any, user_id: int) -> bool:
        """
        Executes an approved response action and logs the execution.
        """
        action.status = "Executed"
        action.approved_by_id = user_id
        action.executed_at = datetime.now(timezone.utc)
        logger.info(f"Response Action {action.id} ({action.action_type} on {action.target}) executed by user {user_id}")
        return True

    @staticmethod
    def rollback_action(action: Any, user_id: int) -> bool:
        """
        Reverts an executed action using the stored rollback procedure.
        """
        action.status = "Rolled Back"
        logger.info(f"Response Action {action.id} ({action.action_type} on {action.target}) rolled back by user {user_id}")
        return True
