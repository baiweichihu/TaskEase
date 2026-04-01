import { useState, useEffect } from "react";

export function NetworkMonitor({ isOpen, onClose, user }) {
  const [requests, setRequests] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // 开始监控网络请求
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [isOpen]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setRequests([]);
    
    // 拦截fetch请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);
      
      setRequests(prev => [...prev, {
        id: requestId,
        url: args[0],
        method: args[1]?.method || 'GET',
        status: 'pending',
        startTime,
        endTime: null,
        duration: null,
        error: null
      }]);
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        setRequests(prev => prev.map(req => 
          req.id === requestId ? {
            ...req,
            status: 'completed',
            endTime,
            duration,
            statusCode: response.status
          } : req
        ));
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        setRequests(prev => prev.map(req => 
          req.id === requestId ? {
            ...req,
            status: 'failed',
            endTime,
            duration,
            error: error.message
          } : req
        ));
        
        throw error;
      }
    };

    // 拦截XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._requestId = Math.random().toString(36).substr(2, 9);
      this._method = method;
      this._url = url;
      this._startTime = Date.now();
      
      setRequests(prev => [...prev, {
        id: this._requestId,
        url,
        method,
        status: 'pending',
        startTime: this._startTime,
        endTime: null,
        duration: null,
        error: null
      }]);
      
      return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      this.addEventListener('load', () => {
        const endTime = Date.now();
        const duration = endTime - this._startTime;
        
        setRequests(prev => prev.map(req => 
          req.id === this._requestId ? {
            ...req,
            status: 'completed',
            endTime,
            duration,
            statusCode: this.status
          } : req
        ));
      });
      
      this.addEventListener('error', () => {
        const endTime = Date.now();
        const duration = endTime - this._startTime;
        
        setRequests(prev => prev.map(req => 
          req.id === this._requestId ? {
            ...req,
            status: 'failed',
            endTime,
            duration,
            error: 'Network error'
          } : req
        ));
      });
      
      return originalSend.apply(this, arguments);
    };

    // 保存原始函数以便恢复
    window._originalFetch = originalFetch;
    window._originalXHROpen = originalOpen;
    window._originalXHRSend = originalSend;
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    // 恢复原始函数
    if (window._originalFetch) {
      window.fetch = window._originalFetch;
    }
    if (window._originalXHROpen) {
      XMLHttpRequest.prototype.open = window._originalXHROpen;
    }
    if (window._originalXHRSend) {
      XMLHttpRequest.prototype.send = window._originalXHRSend;
    }
  };

  const clearRequests = () => {
    setRequests([]);
  };

  const triggerTestRequest = async () => {
    const supabaseUrl = "https://ccfmbcvlmlvirkattqnv.supabase.co";
    const supabaseKey = "sb_publishable_XO9o2kqTKkcnHmGEqCmOoQ_vcNyBGk9";
    
    try {
      // 测试基础连接
      await fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch {
      /* ignore */
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1060,
        }}
      />

      <div
        className="modal d-block"
        tabIndex="-1"
        style={{ zIndex: 1070 }}
      >
        <div className="modal-dialog modal-lg" style={{ marginTop: "60px" }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-6">网络请求监控</h2>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="d-flex gap-2 mb-3">
                <button 
                  className="btn btn-sm" 
                  onClick={triggerTestRequest}
                  style={{ backgroundColor: isMonitoring ? "#4caf50" : "#f44336", color: "white" }}
                >
                  测试连接
                </button>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={clearRequests}
                >
                  清除记录
                </button>
                <span className="badge bg-primary align-self-center">
                  {isMonitoring ? "监控中" : "已停止"}
                </span>
              </div>
              
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>方法</th>
                      <th>URL</th>
                      <th>状态</th>
                      <th>耗时</th>
                      <th>详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice().reverse().map((request) => (
                      <tr key={request.id}>
                        <td>
                          <span className={`badge ${
                            request.method === 'GET' ? 'bg-info' : 
                            request.method === 'POST' ? 'bg-success' : 
                            request.method === 'PUT' ? 'bg-warning' : 
                            request.method === 'DELETE' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {request.method}
                          </span>
                        </td>
                        <td className="small" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {request.url}
                        </td>
                        <td>
                          <span className={`badge ${
                            request.status === 'completed' ? 'bg-success' : 
                            request.status === 'failed' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          {request.duration ? `${request.duration}ms` : '-'}
                        </td>
                        <td className="small">
                          {request.statusCode && `状态码: ${request.statusCode}`}
                          {request.error && `错误: ${request.error}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {requests.length === 0 && (
                  <div className="text-center text-muted py-3">
                    暂无网络请求记录
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}