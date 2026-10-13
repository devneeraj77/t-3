/**
 * Athenaeum Personal Library - Client Application
 * Compatible with all FreeCodeCamp QA requirements and DOM contracts
 */

$(document).ready(function() {
  let itemsRaw = [];
  let currentSelectedBookId = null;

  // Notification Toast Helper
  function showToast(message, type = 'info') {
    const $toast = $('<div class="toast"/>').text(message);
    if (type === 'error') {
      $toast.css('border-color', '#E53E3E').css('color', '#FEB2B2');
    } else if (type === 'success') {
      $toast.css('border-color', '#48BB78').css('color', '#C6F6D5');
    }
    $('#toastContainer').append($toast);
    setTimeout(function() {
      $toast.fadeOut(400, function() {
        $(this).remove();
      });
    }, 3200);
  }

  // Update Header Totals
  function updateHeaderStats(data) {
    const totalBooks = data.length;
    let totalComments = 0;
    data.forEach(function(b) {
      totalComments += (b.commentcount || 0);
    });

    $('#headerTotalBooks').text(totalBooks + (totalBooks === 1 ? ' Volume In Collection' : ' Volumes In Collection'));
    $('#headerTotalComments').text(totalComments + (totalComments === 1 ? ' Total Marginalia' : ' Total Marginalia'));
    $('#catalogCounterBadge').text(totalBooks + (totalBooks === 1 ? ' Volume' : ' Volumes'));
  }

  // Load and Render Books
  function loadBooks(selectedIdToKeep = null) {
    $.getJSON('/api/books', function(data) {
      itemsRaw = data;
      updateHeaderStats(data);

      if (!data || data.length === 0) {
        $('#display').html(
          '<div class="catalog-empty-state">' +
            '<div class="catalog-empty-icon">📖</div>' +
            '<p style="font-weight: 600; color: var(--color-wood-deep); margin-bottom: 0.35rem;">The catalog shelves are currently empty</p>' +
            '<p style="font-size: 0.95rem;">Acquire your first literary volume above to begin archiving.</p>' +
          '</div>'
        );
        resetDetailView();
        return;
      }

      renderFilteredBooks(data, selectedIdToKeep);
    }).fail(function() {
      $('#display').html(
        '<div class="catalog-empty-state">' +
          '<div class="catalog-empty-icon">⚠️</div>' +
          '<p>Unable to connect to the archive. Ensure server is online.</p>' +
        '</div>'
      );
    });
  }

  // Filter and display books
  function renderFilteredBooks(data, selectedIdToKeep = null) {
    const searchTerm = ($('#catalogSearchInput').val() || '').toLowerCase().trim();
    const items = [];

    $.each(data, function(i, val) {
      if (searchTerm && !val.title.toLowerCase().includes(searchTerm)) {
        return;
      }

      const isSelected = selectedIdToKeep && (val._id === selectedIdToKeep);
      const activeClass = isSelected ? ' active' : '';

      items.push(
        '<li class="bookItem' + activeClass + '" id="' + i + '" data-bookid="' + val._id + '">' +
          '<div class="book-item-title">' + escapeHtml(val.title) + '</div>' +
          '<div class="book-item-meta">' +
            '<span class="book-comment-tag">✒️ ' + val.commentcount + (val.commentcount === 1 ? ' note' : ' notes') + '</span>' +
          '</div>' +
        '</li>'
      );
    });

    if (items.length === 0) {
      $('#display').html(
        '<div class="catalog-empty-state">' +
          '<p>No volumes found matching "' + escapeHtml(searchTerm) + '"</p>' +
        '</div>'
      );
      return;
    }

    const $ul = $('<ul/>', {
      class: 'listWrapper',
      html: items.join('')
    });

    $('#display').empty().append($ul);

    if (selectedIdToKeep) {
      const idx = data.findIndex(b => b._id === selectedIdToKeep);
      if (idx !== -1) {
        openBookDetail(idx);
      }
    }
  }

  // Open Book Detail by Index
  function openBookDetail(index) {
    if (!itemsRaw[index]) return;
    const selectedBook = itemsRaw[index];
    currentSelectedBookId = selectedBook._id;

    // Highlight in list
    $('.bookItem').removeClass('active');
    $('.bookItem[data-bookid="' + selectedBook._id + '"]').addClass('active');

    // UI state
    $('#emptyDetailPlaceholder').hide();
    $('#activeBookView').show();
    $('#readingRoomStatusBadge').text('Perusing Volume');

    // Canonical FCC ID #detailTitle format
    $('#detailTitle').html('<b>' + escapeHtml(selectedBook.title) + '</b> (id: ' + selectedBook._id + ')');
    $('#activeBookTitleDisplay').text(selectedBook.title);
    $('#activeBookIdDisplay').text(selectedBook._id);

    // Fetch full book details with comments
    $.getJSON('/api/books/' + selectedBook._id, function(data) {
      const comments = [];
      const commentList = data.comments || [];

      if (commentList.length === 0) {
        comments.push('<li class="no-comments-msg">No marginalia recorded for this volume yet. Add the inaugural scholarly note below.</li>');
      } else {
        $.each(commentList, function(i, val) {
          comments.push('<li>' + escapeHtml(val) + '</li>');
        });
      }

      // Canonical FCC form & buttons structure inside #detailComments container
      comments.push(
        '<div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px dashed var(--color-border);">' +
          '<form id="newCommentForm" onsubmit="return false;" class="comment-input-wrap">' +
            '<label class="form-label" for="commentToAdd">Record Scholarly Annotation</label>' +
            '<input style="width:100%" type="text" class="archival-input form-control" id="commentToAdd" name="comment" placeholder="Affix scholarly marginalia..." autocomplete="off">' +
          '</form>' +
          '<div class="detail-actions-row">' +
            '<button class="btn-primary addComment" id="' + data._id + '">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> ' +
              'Add Comment' +
            '</button>' +
            '<button class="btn-danger deleteBook" id="' + data._id + '">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> ' +
              'Delete Book' +
            '</button>' +
          '</div>' +
        '</div>'
      );

      $('#detailComments').html(comments.join(''));
    }).fail(function() {
      showToast('Could not retrieve volume annotations', 'error');
    });
  }

  // Reset Reading Room Detail View
  function resetDetailView() {
    currentSelectedBookId = null;
    $('#activeBookView').hide();
    $('#emptyDetailPlaceholder').show();
    $('#detailTitle').text("Select a book to see it's details and comments");
    $('#detailComments').empty();
    $('#readingRoomStatusBadge').text('Awaiting Selection');
    $('.bookItem').removeClass('active');
  }

  // Select Book Item Click
  $('#display').on('click', 'li.bookItem', function() {
    openBookDetail(this.id);
  });

  // Add Comment Handler
  $('#bookDetail').on('click', 'button.addComment', function(e) {
    e.preventDefault();
    const bookId = this.id;
    const commentVal = $('#commentToAdd').val();

    if (!commentVal || !commentVal.trim()) {
      showToast('Annotation text cannot be blank', 'error');
      $('#commentToAdd').focus();
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Affixing note...');

    $.ajax({
      url: '/api/books/' + bookId,
      type: 'post',
      dataType: 'json',
      data: $('#newCommentForm').serialize(),
      success: function(data) {
        showToast('Marginalia recorded successfully', 'success');
        loadBooks(bookId);
      },
      error: function(xhr) {
        showToast(xhr.responseText || 'Error adding annotation', 'error');
        $btn.prop('disabled', false).text('Add Comment');
      }
    });
  });

  // Delete Single Book Handler
  $('#bookDetail').on('click', 'button.deleteBook', function(e) {
    e.preventDefault();
    const bookId = this.id;
    const bookTitle = $('#activeBookTitleDisplay').text() || 'this volume';

    if (!confirm('Are you certain you wish to deaccession "' + bookTitle + '" from the archives?')) {
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Deaccessioning...');

    $.ajax({
      url: '/api/books/' + bookId,
      type: 'delete',
      success: function(response) {
        showToast(response || 'Volume deaccessioned successfully', 'success');
        resetDetailView();
        loadBooks();
      },
      error: function(xhr) {
        showToast(xhr.responseText || 'Error deleting volume', 'error');
        $btn.prop('disabled', false).text('Delete Book');
      }
    });
  });

  // Submit New Book Form
  function submitNewBook() {
    const titleVal = $('#bookTitleToAdd').val();
    if (!titleVal || !titleVal.trim()) {
      showToast('Please enter a book title to acquire', 'error');
      $('#bookTitleToAdd').focus();
      return;
    }

    const $btn = $('#newBook');
    $btn.prop('disabled', true).text('Acquiring Volume...');

    $.ajax({
      url: '/api/books',
      type: 'post',
      dataType: 'json',
      data: $('#newBookForm').serialize(),
      success: function(newBook) {
        $('#bookTitleToAdd').val('');
        $btn.prop('disabled', false).html(
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Acquire Volume Into Catalog'
        );
        showToast('Acquired "' + newBook.title + '" into the archive!', 'success');
        loadBooks(newBook._id);
      },
      error: function(xhr) {
        $btn.prop('disabled', false).text('Acquire Volume Into Catalog');
        showToast(xhr.responseText || 'Error acquiring volume', 'error');
      }
    });
  }

  $('#newBook').click(function(e) {
    e.preventDefault();
    submitNewBook();
  });

  $('#newBookForm').submit(function(e) {
    e.preventDefault();
    submitNewBook();
  });

  // Delete All Books Handler
  $('#deleteAllBooks').click(function(e) {
    e.preventDefault();
    if (!itemsRaw || itemsRaw.length === 0) {
      showToast('The catalog is already devoid of volumes.', 'info');
      return;
    }

    if (!confirm('CAUTION: Deaccessioning all volumes will permanently purge the entire catalog. Proceed?')) {
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Purging catalog...');

    $.ajax({
      url: '/api/books',
      type: 'delete',
      success: function(response) {
        showToast(response || 'Complete delete successful', 'success');
        resetDetailView();
        loadBooks();
        $btn.prop('disabled', false).text('Deaccession All Volumes...');
      },
      error: function(xhr) {
        showToast(xhr.responseText || 'Error purging catalog', 'error');
        $btn.prop('disabled', false).text('Deaccession All Volumes...');
      }
    });
  });

  // Search Filter Input
  $('#catalogSearchInput').on('input', function() {
    renderFilteredBooks(itemsRaw, currentSelectedBookId);
  });

  // Copy ID Chip
  $('#copyIdChip').click(function() {
    const id = $('#activeBookIdDisplay').text();
    if (id && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(function() {
        showToast('Volume ID copied to clipboard: ' + id, 'success');
      });
    }
  });

  // Navigation Tab Switching
  $('.nav-tab-btn').click(function() {
    const tabName = $(this).data('tab');
    $('.nav-tab-btn').removeClass('active');
    $(this).addClass('active');

    $('.tab-pane').removeClass('active');
    $('#' + tabName + 'Tab').addClass('active');
  });

  // Interactive Console Quick Actions
  $('#consoleGetBooksBtn').click(function() {
    $('#consoleEndpointInput').val('/api/books');
    executeConsoleRequest('GET', '/api/books');
  });

  $('#consoleDeleteAllBtn').click(function() {
    if (confirm('Execute DELETE /api/books from the Scriptorium Console?')) {
      $('#consoleEndpointInput').val('/api/books');
      executeConsoleRequest('DELETE', '/api/books');
    }
  });

  $('#consoleSendBtn').click(function() {
    const endpoint = $('#consoleEndpointInput').val().trim();
    executeConsoleRequest('GET', endpoint);
  });

  function executeConsoleRequest(method, endpoint) {
    $('#consoleResponseStatus').text('Executing...');
    $('#consoleOutputTerminal').text('// Contacting server at ' + endpoint + '...');

    const startTime = performance.now();
    $.ajax({
      url: endpoint,
      type: method,
      complete: function(xhr) {
        const duration = Math.round(performance.now() - startTime);
        $('#consoleResponseStatus').text(xhr.status + ' ' + xhr.statusText + ' (' + duration + 'ms)');

        let formattedOutput;
        try {
          const parsed = JSON.parse(xhr.responseText);
          formattedOutput = JSON.stringify(parsed, null, 2);
        } catch (e) {
          formattedOutput = xhr.responseText || '(Empty Response Body)';
        }

        const headerStr = '// HTTP ' + xhr.status + ' ' + xhr.statusText + ' [' + duration + 'ms]\n\n';
        $('#consoleOutputTerminal').text(headerStr + formattedOutput);
      }
    });
  }

  // QA Test Runner Live Fetch
  $('#runQaTestsBtn').click(function() {
    const $btn = $(this);
    $btn.prop('disabled', true).text('Querying Test Runner...');

    $.getJSON('/_api/get-tests?type=functional', function(tests) {
      $btn.prop('disabled', false).html(
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Refresh Test Report'
      );

      $('#testRunnerReportContainer').slideDown();

      if (!Array.isArray(tests) || tests.length === 0) {
        $('#testItemsList').html('<p style="color: var(--color-ink-muted);">Test runner returned no functional tests. Ensure NODE_ENV=test.</p>');
        return;
      }

      const passedCount = tests.filter(t => t.state === 'passed').length;
      $('#testSummaryBadge').text(passedCount + ' / ' + tests.length + ' Passing');

      const rows = tests.map(function(t, idx) {
        return (
          '<div class="test-report-row">' +
            '<div>' +
              '<strong>#' + (idx + 1) + ' ' + escapeHtml(t.title) + '</strong><br>' +
              '<span style="font-size: 0.8rem; color: var(--color-ink-muted);">' + escapeHtml(t.context || '') + ' (' + (t.assertions ? t.assertions.length : 0) + ' assertions)</span>' +
            '</div>' +
            '<span class="status-badge-pass">' + escapeHtml(t.state ? t.state.toUpperCase() : 'PASS') + '</span>' +
          '</div>'
        );
      });

      $('#testItemsList').html(rows.join(''));
      showToast('Test runner report loaded: ' + passedCount + '/' + tests.length + ' tests passed!', 'success');
    }).fail(function() {
      $btn.prop('disabled', false).text('Fetch Live Test Runner Report');
      showToast('Could not fetch test report. Check server logs.', 'error');
    });
  });

  // HTML Entity Escaping Helper
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initial Load
  loadBooks();
});
