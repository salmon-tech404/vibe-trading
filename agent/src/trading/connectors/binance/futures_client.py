"""Binance USD-M Futures REST API Client.

Supports both:
- Mainnet: https://fapi.binance.com
- Testnet: https://testnet.binancefuture.com

Features:
- HMAC-SHA256 signature generation
- Account balance & Margin info
- Bracket Orders (Market Entry + STOP_MARKET + TAKE_PROFIT_MARKET)
- Leverage & Isolated Margin setting
- Live Open Positions tracking
- Emergency Kill Switch (Close all positions + Cancel all orders)
"""

from __future__ import annotations

import hashlib
import hmac
import time
import urllib.parse
from typing import Any, Dict, List, Optional
import urllib.request
import json
import ssl


class BinanceFuturesClient:
    MAINNET_BASE_URL = "https://fapi.binance.com"
    TESTNET_BASE_URL = "https://testnet.binancefuture.com"

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        is_testnet: bool = True,
        timeout: float = 10.0,
    ) -> None:
        self.api_key = (api_key or "").strip()
        self.api_secret = (api_secret or "").strip()
        self.is_testnet = is_testnet
        self.base_url = self.TESTNET_BASE_URL if is_testnet else self.MAINNET_BASE_URL
        self.timeout = timeout
        self._ctx = ssl.create_default_context()

    def _sign(self, params: Dict[str, Any]) -> str:
        """Create HMAC-SHA256 signature for query params."""
        query_string = urllib.parse.urlencode(params)
        return hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        signed: bool = False,
    ) -> Dict[str, Any]:
        """Perform HTTPS request to Binance USD-M Futures."""
        p = dict(params or {})
        if signed:
            if not self.api_key or not self.api_secret:
                raise ValueError("Binance API Key and Secret are required for signed endpoints.")
            p["timestamp"] = int(time.time() * 1000)
            p["recvWindow"] = 5000
            p["signature"] = self._sign(p)

        url = f"{self.base_url}{endpoint}"
        query_str = urllib.parse.urlencode(p)

        req_url = url
        data = None

        if method.upper() == "GET" and query_str:
            req_url = f"{url}?{query_str}"
        elif method.upper() in ("POST", "PUT", "DELETE"):
            if method.upper() == "DELETE" and query_str:
                req_url = f"{url}?{query_str}"
            else:
                data = query_str.encode("utf-8")

        req = urllib.request.Request(req_url, data=data, method=method.upper())
        req.add_header("X-MBX-APIKEY", self.api_key)
        req.add_header("User-Agent", "Vibe-Trading-Bot/1.0")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout, context=self._ctx) as resp:
                resp_text = resp.read().decode("utf-8")
                return json.loads(resp_text)
        except urllib.error.HTTPError as err:
            err_text = err.read().decode("utf-8", errors="ignore")
            try:
                err_json = json.loads(err_text)
                msg = err_json.get("msg", err_text)
            except Exception:
                msg = err_text
            raise RuntimeError(f"Binance Futures API Error ({err.code}): {msg}") from err
        except Exception as exc:
            raise RuntimeError(f"Network error connecting to Binance: {str(exc)}") from exc

    def test_connection(self) -> Dict[str, Any]:
        """Test API Key validity and fetch server time."""
        server_time = self._request("GET", "/fapi/v1/time", signed=False)
        account = self._request("GET", "/fapi/v2/account", signed=True)
        return {
            "status": "ok",
            "serverTime": server_time.get("serverTime"),
            "canTrade": account.get("canTrade", False),
            "totalWalletBalance": float(account.get("totalWalletBalance", 0)),
            "totalUnrealizedProfit": float(account.get("totalUnrealizedProfit", 0)),
        }

    def get_account_balance(self) -> Dict[str, Any]:
        """Get USDT Wallet & Available Margin balance."""
        balances = self._request("GET", "/fapi/v2/balance", signed=True)
        usdt_bal = next((b for b in balances if b.get("asset") == "USDT"), None)
        if not usdt_bal:
            return {
                "asset": "USDT",
                "balance": 0.0,
                "availableBalance": 0.0,
                "unrealizedProfit": 0.0,
            }
        return {
            "asset": "USDT",
            "balance": float(usdt_bal.get("balance", 0)),
            "availableBalance": float(usdt_bal.get("availableBalance", 0)),
            "unrealizedProfit": float(usdt_bal.get("crossUnPnl", 0)),
        }

    def set_leverage(self, symbol: str, leverage: int = 10) -> Dict[str, Any]:
        """Set leverage for a symbol."""
        sym = symbol.replace("/", "").replace("-", "").upper()
        return self._request("POST", "/fapi/v1/leverage", {"symbol": sym, "leverage": leverage}, signed=True)

    def set_margin_type(self, symbol: str, margin_type: str = "ISOLATED") -> Dict[str, Any]:
        """Set margin type (ISOLATED or CROSSED)."""
        sym = symbol.replace("/", "").replace("-", "").upper()
        try:
            return self._request("POST", "/fapi/v1/marginType", {"symbol": sym, "marginType": margin_type.upper()}, signed=True)
        except RuntimeError as exc:
            # Code -4046: "No need to change margin type"
            if "No need to change" in str(exc):
                return {"status": "ok", "message": "Already configured"}
            raise

    def get_open_positions(self) -> List[Dict[str, Any]]:
        """Get all currently active positions with non-zero position amount."""
        positions = self._request("GET", "/fapi/v2/positionRisk", signed=True)
        active = []
        for p in positions:
            amt = float(p.get("positionAmt", 0))
            if abs(amt) > 0:
                active.append({
                    "symbol": p.get("symbol"),
                    "positionAmt": amt,
                    "entryPrice": float(p.get("entryPrice", 0)),
                    "markPrice": float(p.get("markPrice", 0)),
                    "unRealizedProfit": float(p.get("unRealizedProfit", 0)),
                    "liquidationPrice": float(p.get("liquidationPrice", 0)),
                    "leverage": int(p.get("leverage", 1)),
                    "marginType": p.get("marginType", "isolated"),
                    "direction": "LONG" if amt > 0 else "SHORT",
                })
        return active

    def place_bracket_order(
        self,
        symbol: str,
        side: str,  # "BUY" (for Long) or "SELL" (for Short)
        quantity: float,
        stop_loss_price: Optional[float] = None,
        take_profit_price: Optional[float] = None,
        leverage: int = 10,
    ) -> Dict[str, Any]:
        """Place a Market Entry order immediately flanked by STOP_MARKET and TAKE_PROFIT_MARKET orders."""
        sym = symbol.replace("/", "").replace("-", "").upper()
        side_clean = side.upper()
        exit_side = "SELL" if side_clean == "BUY" else "BUY"

        # 1. Ensure isolated margin & leverage
        try:
            self.set_margin_type(sym, "ISOLATED")
        except Exception:
            pass
        try:
            self.set_leverage(sym, leverage)
        except Exception:
            pass

        # 2. Place Market Entry Order
        entry_order = self._request(
            "POST",
            "/fapi/v1/order",
            {
                "symbol": sym,
                "side": side_clean,
                "type": "MARKET",
                "quantity": quantity,
            },
            signed=True,
        )

        sl_order = None
        tp_order = None

        # 3. Place Stop Loss Order (STOP_MARKET with closePosition=True)
        if stop_loss_price and stop_loss_price > 0:
            try:
                sl_order = self._request(
                    "POST",
                    "/fapi/v1/order",
                    {
                        "symbol": sym,
                        "side": exit_side,
                        "type": "STOP_MARKET",
                        "stopPrice": stop_loss_price,
                        "closePosition": "true",
                    },
                    signed=True,
                )
            except Exception as exc:
                print(f"Warning: Failed to place Stop Loss order: {exc}")

        # 4. Place Take Profit Order (TAKE_PROFIT_MARKET)
        if take_profit_price and take_profit_price > 0:
            try:
                tp_order = self._request(
                    "POST",
                    "/fapi/v1/order",
                    {
                        "symbol": sym,
                        "side": exit_side,
                        "type": "TAKE_PROFIT_MARKET",
                        "stopPrice": take_profit_price,
                        "closePosition": "true",
                    },
                    signed=True,
                )
            except Exception as exc:
                print(f"Warning: Failed to place Take Profit order: {exc}")

        return {
            "status": "ok",
            "symbol": sym,
            "side": side_clean,
            "quantity": quantity,
            "entryOrder": entry_order,
            "stopLossOrder": sl_order,
            "takeProfitOrder": tp_order,
        }

    def close_position(self, symbol: str) -> Dict[str, Any]:
        """Close an active position at market price and cancel all pending orders for symbol."""
        sym = symbol.replace("/", "").replace("-", "").upper()
        positions = self.get_open_positions()
        target = next((p for p in positions if p["symbol"] == sym), None)

        if not target:
            # Cancel open orders anyway
            try:
                self._request("DELETE", "/fapi/v1/allOpenOrders", {"symbol": sym}, signed=True)
            except Exception:
                pass
            return {"status": "ok", "message": f"No active position for {sym}"}

        amt = target["positionAmt"]
        close_side = "SELL" if amt > 0 else "BUY"
        qty = abs(amt)

        # Place market close order
        close_order = self._request(
            "POST",
            "/fapi/v1/order",
            {
                "symbol": sym,
                "side": close_side,
                "type": "MARKET",
                "quantity": qty,
                "reduceOnly": "true",
            },
            signed=True,
        )

        # Cancel remaining open orders
        try:
            self._request("DELETE", "/fapi/v1/allOpenOrders", {"symbol": sym}, signed=True)
        except Exception:
            pass

        return {
            "status": "ok",
            "closedSymbol": sym,
            "closedAmount": qty,
            "order": close_order,
        }

    def emergency_halt_all(self) -> Dict[str, Any]:
        """EMERGENCY KILL SWITCH: Close all positions and cancel all open orders across the entire account."""
        positions = self.get_open_positions()
        results = []
        for pos in positions:
            try:
                res = self.close_position(pos["symbol"])
                results.append(res)
            except Exception as exc:
                results.append({"symbol": pos["symbol"], "error": str(exc)})

        return {
            "status": "halted",
            "closedCount": len(positions),
            "details": results,
        }
